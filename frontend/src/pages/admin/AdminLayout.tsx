import { NavLink, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

const tabs = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/users', label: 'Users', end: false },
  { to: '/admin/transactions', label: 'Transactions', end: false },
  { to: '/admin/categories', label: 'Categories', end: false },
  { to: '/admin/export', label: 'Export', end: false },
];

export default function AdminLayout() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>🛡️ Admin Panel</h1>
        <p style={{ fontSize: 14, color: '#9ca3af', margin: '4px 0 0' }}>Manage users, transactions, categories and platform data</p>
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e5e7eb', overflowX: 'auto' }}>
        {tabs.map(t => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', fontSize: 14, fontWeight: 500,
              textDecoration: 'none', whiteSpace: 'nowrap',
              color: isActive ? '#7c3aed' : '#6b7280',
              borderBottom: isActive ? '2px solid #7c3aed' : '2px solid transparent',
              transition: 'all 0.2s',
            })}
          >
            {t.label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </motion.div>
  );
}
