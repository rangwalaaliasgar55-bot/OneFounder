import { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Download,
  Calculator,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useTable } from '../hooks/useTable';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
}

const initialTransactions: Transaction[] = [
  { id: '1', description: 'Enterprise Subscription', amount: 4999, type: 'income', category: 'Revenue', date: '2026-06-25' },
  { id: '2', description: 'AWS Services', amount: 892, type: 'expense', category: 'Infrastructure', date: '2026-06-24' },
  { id: '3', description: 'Pro Plan Upgrade', amount: 199, type: 'income', category: 'Revenue', date: '2026-06-23' },
  { id: '4', description: 'Stripe Fees', amount: 156, type: 'expense', category: 'Payment Processing', date: '2026-06-22' },
  { id: '5', description: 'Enterprise Subscription', amount: 2499, type: 'income', category: 'Revenue', date: '2026-06-20' },
  { id: '6', description: 'Marketing Tools', amount: 299, type: 'expense', category: 'Marketing', date: '2026-06-18' },
];

const categories = ['Revenue', 'Infrastructure', 'Marketing', 'Payment Processing', 'Tools & Services', 'Salaries', 'Other'];

const PIE_COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899'];

export default function Finance() {
  const toast = useToast();
  const { rows: transactions, addRow } = useTable<Transaction>('transactions', initialTransactions);
  const [timeRange, setTimeRange] = useState('month');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'income' as Transaction['type'],
    category: 'Revenue',
    date: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Runway calculator inputs
  const [cashOnHand, setCashOnHand] = useState('50000');
  const [growthRate, setGrowthRate] = useState('10');

  const chartData = useMemo(
    () =>
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => ({
        month,
        revenue: [40, 52, 47, 63, 58, 72][i],
        expenses: [28, 31, 25, 38, 30, 35][i],
      })),
    [],
  );

  const mrr = useMemo(() => {
    const income = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    return 12450 + income - 4999 - 199 - 2499;
  }, [transactions]);

  const totalExpenses = useMemo(() => {
    return transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) + 8500 - 892 - 156 - 299;
  }, [transactions]);

  const arr = mrr * 12;
  const profit = mrr - totalExpenses;

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
      });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const monthlyBurn = totalExpenses;
  const runwayMonths = cashOnHand && monthlyBurn > 0 ? Number(cashOnHand) / monthlyBurn : 0;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0)
      newErrors.amount = 'Valid amount required';
    if (!formData.date) newErrors.date = 'Date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTransaction = async () => {
    if (!validateForm()) return;
    await addRow({
      description: formData.description,
      amount: Number(formData.amount),
      type: formData.type,
      category: formData.category,
      date: formData.date,
    });
    toast('Transaction added successfully');
    setShowAddModal(false);
    setFormData({ description: '', amount: '', type: 'income', category: 'Revenue', date: new Date().toISOString().split('T')[0] });
    setErrors({});
  };

  const exportCSV = () => {
    const headers = ['Description', 'Amount', 'Type', 'Category', 'Date'];
    const rows = transactions.map((t) => [t.description, t.amount, t.type, t.category, t.date]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast('CSV exported successfully');
  };

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
              <option value="week" className="bg-slate-800">This Week</option>
              <option value="month" className="bg-slate-800">This Month</option>
              <option value="quarter" className="bg-slate-800">This Quarter</option>
              <option value="year" className="bg-slate-800">This Year</option>
            </select>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity"
          >
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
          { title: 'Expenses', value: `$${totalExpenses.toLocaleString()}`, change: 8.2, icon: CreditCard, positive: false },
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
        {/* Revenue Chart */}
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
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #ffffff20',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
              <ReferenceLine y={50} stroke="#06b6d4" strokeDasharray="5 5" label={{ value: 'Break-even', fill: '#06b6d4', fontSize: 10 }} />
              <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Breakdown Pie Chart */}
        <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Expense Breakdown</h2>
          {expenseByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={expenseByCategory}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `$${entry.value}`}
                >
                  {expenseByCategory.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #ffffff20',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </RechartsPieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">
              No expense data
            </div>
          )}
        </div>
      </div>

      {/* Runway Calculator */}
      <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-white">Runway Calculator</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Current Cash ($)</label>
            <input
              type="number"
              value={cashOnHand}
              onChange={(e) => setCashOnHand(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Monthly Burn ($)</label>
            <input
              type="number"
              value={monthlyBurn}
              readOnly
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-slate-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Growth Rate (%)</label>
            <input
              type="number"
              value={growthRate}
              onChange={(e) => setGrowthRate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/30">
          <p className="text-2xl font-bold text-white">
            {runwayMonths > 0 ? runwayMonths.toFixed(1) : '0'} months
          </p>
          <p className="text-sm text-slate-400">runway at current burn rate</p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Transactions</h2>
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${tx.type === 'income' ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
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
              <span className={`font-semibold ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Transaction Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Transaction">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Transaction description"
              className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none transition-colors ${
                errors.description ? 'border-rose-500/50' : 'border-white/10 focus:border-cyan-500/50'
              }`}
            />
            {errors.description && <p className="text-xs text-rose-400 mt-1">{errors.description}</p>}
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Amount ($)</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
              className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none transition-colors ${
                errors.amount ? 'border-rose-500/50' : 'border-white/10 focus:border-cyan-500/50'
              }`}
            />
            {errors.amount && <p className="text-xs text-rose-400 mt-1">{errors.amount}</p>}
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFormData((prev) => ({ ...prev, type: 'income' }))}
                className={`flex-1 py-2.5 rounded-xl border text-sm transition-all ${
                  formData.type === 'income'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                Income
              </button>
              <button
                onClick={() => setFormData((prev) => ({ ...prev, type: 'expense' }))}
                className={`flex-1 py-2.5 rounded-xl border text-sm transition-all ${
                  formData.type === 'expense'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    : 'border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                Expense
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-slate-800">{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-white focus:outline-none transition-colors ${
                errors.date ? 'border-rose-500/50' : 'border-white/10 focus:border-cyan-500/50'
              }`}
            />
            {errors.date && <p className="text-xs text-rose-400 mt-1">{errors.date}</p>}
          </div>
          <button
            onClick={handleAddTransaction}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity"
          >
            Add Transaction
          </button>
        </div>
      </Modal>
    </div>
  );
}
