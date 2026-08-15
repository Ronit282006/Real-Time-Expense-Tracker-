import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

import { getDashboardApi } from '../api/client';
import type { DashboardData } from '../types';
import KpiCard from '../components/KpiCard';
import { FullPageLoader } from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const COLORS = ['#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];

const kpiIcons = {
  income: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  expense: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  balance: 'M9 8h6m-5 0a3 3 0 110 6H9l3-3m-3 3l3 3m3-6a3 3 0 110 6h1m-1-6l-3-3m3 3l-3 3',
  count: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardApi()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <FullPageLoader />;
  if (!data) return <p style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>No data available.</p>;

  const fm = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
  const tooltipFm = (v: any) => fm(typeof v === 'number' ? v : 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: 14, color: '#9ca3af', margin: '4px 0 0' }}>Your financial overview</p>
      </motion.div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard title="Total Income" value={fm(data.total_income)} color="#10b981" icon={kpiIcons.income} delay={0.05} subtitle="All time" />
        <KpiCard title="Total Expense" value={fm(data.total_expense)} color="#ef4444" icon={kpiIcons.expense} delay={0.1} subtitle="All time" />
        <KpiCard title="Balance" value={fm(data.current_balance)} color={data.current_balance >= 0 ? '#7c3aed' : '#ef4444'} icon={kpiIcons.balance} delay={0.15} subtitle="Current" />
        <KpiCard title="Transactions" value={data.transaction_count} color="#3b82f6" icon={kpiIcons.count} delay={0.2} subtitle="Total entries" />
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          style={{ flex: 2, minWidth: 300, background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Monthly Income vs Expense</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.monthly_summary}>
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(v: any) => [tooltipFm(v), undefined]}
              />
              <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} name="Income" />
              <Bar dataKey="expense" fill="#ef4444" radius={[6, 6, 0, 0]} name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ flex: 1, minWidth: 250, background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Expense by Category</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data.expense_by_category}
                dataKey="amount" nameKey="category"
                cx="50%" cy="50%" outerRadius={90}
              label={({ category, percent }: any) => `${category} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
                {data.expense_by_category.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => [tooltipFm(v), undefined]} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          style={{ flex: 1, minWidth: 300, background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Income Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.monthly_summary}>
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <Tooltip formatter={(v: any) => [tooltipFm(v), undefined]} />
              <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ flex: 1, minWidth: 300, background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Expense Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.monthly_summary}>
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <Tooltip formatter={(v: any) => [tooltipFm(v), undefined]} />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: '#ef4444' }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Recent Transactions</h3>
        {data.recent_transactions.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: 14 }}>No transactions yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  {['Type', 'Amount', 'Category', 'Note', 'Date'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#9ca3af', fontWeight: 500, fontSize: 12, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recent_transactions.map((t, i) => (
                  <motion.tr
                    key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    style={{ borderBottom: '1px solid #f9fafb' }}
                  >
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        background: t.type === 'income' ? '#ecfdf5' : '#fef2f2',
                        color: t.type === 'income' ? '#059669' : '#dc2626',
                      }}>
                        {t.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600, color: t.type === 'income' ? '#059669' : '#dc2626' }}>
                      {fm(t.amount)}
                    </td>
                    <td style={{ padding: '12px', color: '#6b7280' }}>{t.category}</td>
                    <td style={{ padding: '12px', color: '#9ca3af' }}>{t.note || '—'}</td>
                    <td style={{ padding: '12px', color: '#6b7280' }}>{new Date(t.transaction_datetime).toLocaleDateString()}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
