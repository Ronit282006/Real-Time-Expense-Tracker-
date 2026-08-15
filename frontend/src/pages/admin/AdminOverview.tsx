import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { adminStatsApi } from '../../api/client';
import type { PlatformStats } from '../../types';
import KpiCard from '../../components/KpiCard';
import { FullPageLoader } from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const COLORS = ['#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];

const icons = {
  users: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4m4 4a4 4 0 01-4-4m4 4h3a3 3 0 013 3v1M7 20v-1a3 3 0 013-3h0',
  active: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  inactive: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  count: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  income: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  expense: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  balance: 'M9 8h6m-5 0a3 3 0 110 6H9l3-3m-3 3l3 3m3-6a3 3 0 110 6h1m-1-6l-3-3m3 3l-3 3',
  avg: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
};

export default function AdminOverview() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminStatsApi()
      .then(r => setStats(r.data))
      .catch(() => toast.error('Failed to load platform stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <FullPageLoader />;
  if (!stats) return <p style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>No data available.</p>;

  const fm = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  const tooltipFm = (v: any) => fm(typeof v === 'number' ? v : 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard title="Total Users" value={stats.total_users} color="#7c3aed" icon={icons.users} delay={0.05} subtitle="Registered accounts" />
        <KpiCard title="Active Users" value={stats.active_users} color="#10b981" icon={icons.active} delay={0.1} subtitle="Currently enabled" />
        <KpiCard title="Inactive Users" value={stats.inactive_users} color="#ef4444" icon={icons.inactive} delay={0.15} subtitle="Disabled accounts" />
        <KpiCard title="Transactions" value={stats.total_transactions} color="#3b82f6" icon={icons.count} delay={0.2} subtitle="All entries" />
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard title="Total Income" value={fm(stats.total_income)} color="#10b981" icon={icons.income} delay={0.25} subtitle="Platform wide" />
        <KpiCard title="Total Expense" value={fm(stats.total_expense)} color="#ef4444" icon={icons.expense} delay={0.3} subtitle="Platform wide" />
        <KpiCard title="Balance" value={fm(stats.platform_balance)} color={stats.platform_balance >= 0 ? '#7c3aed' : '#ef4444'} icon={icons.balance} delay={0.35} subtitle="Income - Expense" />
        <KpiCard title="Avg Expense / User" value={fm(stats.avg_expense_per_user)} color="#f59e0b" icon={icons.avg} delay={0.4} subtitle="Per account" />
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ flex: 1, minWidth: 300, background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>New Users per Month</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.new_users_per_month}>
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="count" fill="#7c3aed" radius={[6, 6, 0, 0]} name="New users" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={{ flex: 1, minWidth: 300, background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Usage Trends</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={stats.usage_trends}>
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2} dot={{ r: 4, fill: '#7c3aed' }} name="Transactions" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ flex: 1, minWidth: 300, background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Top Categories by Amount</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.top_categories}>
              <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(v: any) => [tooltipFm(v), 'Amount']} />
              <Bar dataKey="total_amount" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Total amount" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={{ flex: 1, minWidth: 300, background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Top Spenders</h3>
          {stats.top_spenders.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: 14 }}>No data yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  {['User', 'Income', 'Expense', 'Txns'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#9ca3af', fontWeight: 500, fontSize: 12, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.top_spenders.map(s => (
                  <tr key={s.profile_id} style={{ borderBottom: '1px solid #f9fafb' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600, color: '#374151' }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>{s.email}</div>
                    </td>
                    <td style={{ padding: '12px', color: '#059669' }}>{fm(s.total_income)}</td>
                    <td style={{ padding: '12px', color: '#dc2626' }}>{fm(s.total_expense)}</td>
                    <td style={{ padding: '12px', color: '#6b7280' }}>{s.transaction_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
