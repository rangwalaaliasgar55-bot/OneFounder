import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  PieChart,
  Plus,
  Wallet,
} from 'lucide-react';
import Modal from '../components/Modal';
import StatCard from '../components/StatCard';
import { formatCompactCurrency, formatCurrency } from '../lib/workspace';
import type { Transaction, TransactionType } from '../types';

interface FinanceProps {
  transactions: Transaction[];
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}

interface TransactionFormState {
  description: string;
  amount: string;
  type: TransactionType;
  category: string;
  date: string;
}

const emptyTransactionForm: TransactionFormState = {
  description: '',
  amount: '',
  type: 'expense',
  category: 'Infrastructure',
  date: new Date().toISOString().slice(0, 10),
};

const rangeOptions = [
  { id: 'month', label: 'This month' },
  { id: 'quarter', label: 'This quarter' },
  { id: 'year', label: 'This year' },
  { id: 'all', label: 'All time' },
] as const;

type TimeRange = (typeof rangeOptions)[number]['id'];

function getRangeStart(range: TimeRange) {
  const start = new Date();
  if (range === 'month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (range === 'quarter') {
    const quarterStartMonth = Math.floor(start.getMonth() / 3) * 3;
    start.setMonth(quarterStartMonth, 1);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (range === 'year') {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  start.setFullYear(start.getFullYear() - 10);
  start.setHours(0, 0, 0, 0);
  return start;
}

export default function Finance({ transactions, onAddTransaction }: FinanceProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState<TransactionFormState>(emptyTransactionForm);

  const filteredTransactions = useMemo(() => {
    const rangeStart = getRangeStart(timeRange).getTime();
    return [...transactions]
      .filter((transaction) => new Date(transaction.date).getTime() >= rangeStart)
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
  }, [timeRange, transactions]);

  const income = filteredTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenses = filteredTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const net = income - expenses;
  const cashReserve = 95000;
  const runwayMonths = expenses > 0 ? (cashReserve / expenses).toFixed(1) : '∞';

  const chartData = useMemo(() => {
    const labels = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index), 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleDateString('en-US', { month: 'short' }),
      };
    });

    return labels.map(({ key, label }) => {
      const monthlyTransactions = transactions.filter((transaction) => {
        const date = new Date(transaction.date);
        return `${date.getFullYear()}-${date.getMonth()}` === key;
      });

      const monthlyIncome = monthlyTransactions
        .filter((transaction) => transaction.type === 'income')
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      const monthlyExpenses = monthlyTransactions
        .filter((transaction) => transaction.type === 'expense')
        .reduce((sum, transaction) => sum + transaction.amount, 0);

      return {
        label,
        income: monthlyIncome,
        expenses: monthlyExpenses,
      };
    });
  }, [transactions]);

  const maxChartValue = Math.max(
    1,
    ...chartData.flatMap((entry) => [entry.income, entry.expenses])
  );

  const expenseBreakdown = useMemo(() => {
    const expenseMap = new Map<string, number>();

    filteredTransactions
      .filter((transaction) => transaction.type === 'expense')
      .forEach((transaction) => {
        expenseMap.set(transaction.category, (expenseMap.get(transaction.category) ?? 0) + transaction.amount);
      });

    return [...expenseMap.entries()]
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: expenses ? Math.round((amount / expenses) * 100) : 0,
      }))
      .sort((left, right) => right.amount - left.amount);
  }, [expenses, filteredTransactions]);

  const exportCsv = () => {
    const header = ['Date', 'Description', 'Type', 'Category', 'Amount'];
    const rows = filteredTransactions.map((transaction) => [
      new Date(transaction.date).toISOString().slice(0, 10),
      transaction.description,
      transaction.type,
      transaction.category,
      String(transaction.amount),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `onefounder-finance-${timeRange}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const submitTransaction = () => {
    const amount = Number(formState.amount);
    if (!formState.description.trim() || !amount || !formState.category.trim() || !formState.date) {
      return;
    }

    onAddTransaction({
      description: formState.description.trim(),
      amount,
      type: formState.type,
      category: formState.category.trim(),
      date: new Date(formState.date).toISOString(),
    });

    setFormState(emptyTransactionForm);
    setIsModalOpen(false);
  };

  const primaryExpense = expenseBreakdown[0];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Financial command center</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Track cashflow with cleaner reporting and useful shortcuts</h1>
            <p className="mt-3 max-w-2xl text-slate-400">
              Finance is now data-driven instead of random placeholder charts. Totals update from your saved transactions,
              expense categories are summarized automatically, and you can export a quick CSV when needed.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:border-white/20 hover:text-white"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Add transaction
            </button>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        {rangeOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setTimeRange(option.id)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              timeRange === option.id
                ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white'
            }`}
          >
            {option.label}
          </button>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Income"
          value={formatCompactCurrency(income)}
          subtitle={`${filteredTransactions.filter((transaction) => transaction.type === 'income').length} transaction(s)`}
          icon={<DollarSign className="h-5 w-5 text-emerald-300" />}
          tone="emerald"
        />
        <StatCard
          title="Expenses"
          value={formatCompactCurrency(expenses)}
          subtitle={`${filteredTransactions.filter((transaction) => transaction.type === 'expense').length} transaction(s)`}
          icon={<CreditCard className="h-5 w-5 text-rose-300" />}
          tone="rose"
        />
        <StatCard
          title="Net movement"
          value={formatCompactCurrency(net)}
          subtitle={net >= 0 ? 'Operating above break-even' : 'Spend is ahead of revenue'}
          icon={<Wallet className="h-5 w-5 text-cyan-300" />}
          tone="cyan"
        />
        <StatCard
          title="Estimated runway"
          value={`${runwayMonths} mo`}
          subtitle={`Based on ${formatCompactCurrency(cashReserve)} reserve`}
          icon={<Calendar className="h-5 w-5 text-amber-300" />}
          tone="amber"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Revenue vs. expenses</h2>
              <p className="mt-1 text-sm text-slate-400">Six-month trend built from actual transaction data.</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                Income
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-400" />
                Expenses
              </div>
            </div>
          </div>

          <div className="mt-8 flex h-72 items-end justify-between gap-3">
            {chartData.map((entry) => (
              <div key={entry.label} className="flex flex-1 flex-col items-center gap-3">
                <div className="flex h-56 w-full items-end justify-center gap-2 rounded-2xl border border-white/5 bg-slate-950/40 px-2 py-3">
                  <div
                    className="w-4 rounded-t-full bg-gradient-to-t from-emerald-500 to-emerald-300"
                    style={{ height: `${(entry.income / maxChartValue) * 100}%` }}
                    title={`Income ${formatCurrency(entry.income)}`}
                  />
                  <div
                    className="w-4 rounded-t-full bg-gradient-to-t from-rose-500 to-rose-300"
                    style={{ height: `${(entry.expenses / maxChartValue) * 100}%` }}
                    title={`Expenses ${formatCurrency(entry.expenses)}`}
                  />
                </div>
                <div className="text-center text-xs text-slate-400">
                  <p>{entry.label}</p>
                  <p>{formatCompactCurrency(entry.income - entry.expenses)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
                <PieChart className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Expense breakdown</h2>
                <p className="text-sm text-slate-400">Automatic category mix for the selected range.</p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {expenseBreakdown.length ? (
                expenseBreakdown.map((entry) => (
                  <div key={entry.category}>
                    <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                      <span>{entry.category}</span>
                      <span>{formatCurrency(entry.amount)} · {entry.percentage}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${entry.percentage}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                  No expenses in this time range yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Finance nudges</h2>
                <p className="text-sm text-slate-400">Small recommendations based on your current entries.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                {net >= 0
                  ? `You are net positive by ${formatCurrency(net)} in the selected range.`
                  : `You are net negative by ${formatCurrency(Math.abs(net))} in the selected range.`}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                {primaryExpense
                  ? `${primaryExpense.category} is your largest cost center at ${formatCurrency(primaryExpense.amount)}.`
                  : 'Add expense data to get cost-center recommendations.'}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Export CSV whenever you need a quick founder update, accountant handoff, or investor snapshot.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">Recent transactions</h2>
            <p className="mt-1 text-sm text-slate-400">Newest financial activity first.</p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {filteredTransactions.map((transaction) => (
            <div key={transaction.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className={`rounded-2xl p-3 ${transaction.type === 'income' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                  {transaction.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                </div>
                <div>
                  <p className="font-medium text-white">{transaction.description}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {transaction.category} · {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <span className={`text-lg font-semibold ${transaction.type === 'income' ? 'text-emerald-300' : 'text-rose-300'}`}>
                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
              </span>
            </div>
          ))}
          {!filteredTransactions.length ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">
              No transactions found in this time range.
            </div>
          ) : null}
        </div>
      </section>

      <Modal
        open={isModalOpen}
        title="Add a transaction"
        description="Keep revenue and expenses current so the dashboard and runway estimates stay useful."
        onClose={() => setIsModalOpen(false)}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-slate-300">Description</span>
            <input
              value={formState.description}
              onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
              placeholder="AWS infrastructure"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Amount (USD)</span>
            <input
              type="number"
              min="0"
              value={formState.amount}
              onChange={(event) => setFormState((current) => ({ ...current, amount: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Type</span>
            <select
              value={formState.type}
              onChange={(event) => setFormState((current) => ({ ...current, type: event.target.value as TransactionType }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Category</span>
            <input
              value={formState.category}
              onChange={(event) => setFormState((current) => ({ ...current, category: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Date</span>
            <input
              type="date"
              value={formState.date}
              onChange={(event) => setFormState((current) => ({ ...current, date: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={submitTransaction}
            className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 font-medium text-white transition-opacity hover:opacity-90"
          >
            Save transaction
          </button>
        </div>
      </Modal>
    </div>
  );
}
