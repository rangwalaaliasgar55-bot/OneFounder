import { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  Calendar,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Filter,
} from 'lucide-react';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
}

const initialTransactions: Transaction[] = [
  { id: '1', description: 'Enterprise Subscription', amount: 4999, type: 'income', category: 'Revenue', date: 'Jun 25' },
  { id: '2', description: 'AWS Services', amount: -892, type: 'expense', category: 'Infrastructure', date: 'Jun 24' },
  { id: '3', description: 'Pro Plan Upgrade', amount: 199, type: 'income', category: 'Revenue', date: 'Jun 23' },
  { id: '4', description: 'Stripe Fees', amount: -156, type: 'expense', category: 'Payment Processing', date: 'Jun 22' },
  { id: '5', description: 'Enterprise Subscription', amount: 2499, type: 'income', category: 'Revenue', date: 'Jun 20' },
  { id: '6', description: 'Marketing Tools', amount: -299, type: 'expense', category: 'Marketing', date: 'Jun 18' },
];

const expenseCategories = [
  { name: 'Infrastructure', percentage: 35, color: 'bg-cyan-500' },
  { name: 'Marketing', percentage: 25, color: 'bg-emerald-500' },
  { name: 'Payment Processing', percentage: 20, color: 'bg-amber-500' },
  { name: 'Tools & Services', percentage: 20, color: 'bg-rose-500' },
];

export default function Finance() {
  const [transactions] = useState<Transaction[]>(initialTransactions);
  const [timeRange, setTimeRange] = useState('month');

  const mrr = 12450;
  const arr = mrr * 12;
  const expenses = 8500;
  const profit = mrr - expenses;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Finance</h1>
          <p className="text-slate-400 mt-1">Track your revenue, expenses, and financial health.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none cursor-pointer"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'MRR', value: `$${mrr.toLocaleString()}`, change: 12.5, icon: TrendingUp, positive: true },
          { title: 'ARR', value: `$${arr.toLocaleString()}`, change: 12.5, icon: DollarSign, positive: true },
          { title: 'Expenses', value: `$${expenses.toLocaleString()}`, change: 8.2, icon: CreditCard, positive: false },
          { title: 'Net Profit', value: `$${profit.toLocaleString()}`, change: 15.3, icon: Wallet, positive: true },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-white/10 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-sm">{stat.title}</span>
              <div className={`p-2 rounded-lg ${stat.positive ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                <stat.icon className={`w-4 h-4 ${stat.positive ? 'text-emerald-400' : 'text-rose-400'}`} />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <div className={`flex items-center gap-1 text-sm ${stat.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stat.positive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                <span>{stat.change}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart Placeholder */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Revenue Overview</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-slate-400">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-sm text-slate-400">Expenses</span>
              </div>
            </div>
          </div>
          {/* Chart placeholder */}
          <div className="h-64 flex items-end justify-between gap-2">
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => {
              const revenueHeight = 40 + Math.random() * 50;
              const expenseHeight = 20 + Math.random() * 30;
              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-1 items-end justify-center" style={{ height: '200px' }}>
                    <div
                      className="w-3 rounded-t bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all hover:opacity-80"
                      style={{ height: `${revenueHeight}%` }}
                    />
                    <div
                      className="w-3 rounded-t bg-gradient-to-t from-rose-500 to-rose-400 transition-all hover:opacity-80"
                      style={{ height: `${expenseHeight}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 mt-2">{month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Expense Breakdown</h2>
          </div>
          <div className="space-y-4">
            {expenseCategories.map((cat) => (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-300">{cat.name}</span>
                  <span className="text-sm text-slate-400">{cat.percentage}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${cat.color} rounded-full transition-all duration-500`}
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
          <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-2 rounded-lg ${
                    tx.type === 'income' ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                  }`}
                >
                  {tx.type === 'income' ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-rose-400" />
                  )}
                </div>
                <div>
                  <p className="text-white font-medium">{tx.description}</p>
                  <p className="text-sm text-slate-400">
                    {tx.category} • {tx.date}
                  </p>
                </div>
              </div>
              <span
                className={`font-semibold ${
                  tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {tx.type === 'income' ? '+' : ''}${Math.abs(tx.amount).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
