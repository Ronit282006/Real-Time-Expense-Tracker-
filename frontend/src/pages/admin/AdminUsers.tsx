import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  adminUsersApi, adminSetUserStatusApi, adminSetUserRoleApi,
  adminResetPasswordApi, adminForceLogoutApi, adminDeleteUserApi,
} from '../../api/client';
import type { AdminUser, AdminUserList } from '../../types';
import ConfirmDialog from '../../components/ConfirmDialog';
import { FullPageLoader } from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import toast from 'react-hot-toast';

const inputStyle: React.CSSProperties = {
  padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: 10,
  fontSize: 14, outline: 'none', background: '#fff',
};

const btn = (color: string): React.CSSProperties => ({
  padding: '7px 14px', borderRadius: 10, border: '1px solid #e5e7eb',
  background: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer',
  color, transition: 'all 0.2s',
});

export default function AdminUsers() {
  const [data, setData] = useState<AdminUserList | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params: Record<string, string | number | boolean> = { skip: 0, limit: 200 };
    if (search) params.search = search;
    if (role) params.role = role;
    if (status) params.is_active = status === 'active';
    adminUsersApi(params)
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, [search, role, status]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleStatus = async (u: AdminUser) => {
    try {
      await adminSetUserStatusApi(u.profile_id, !u.is_active);
      toast.success(u.is_active ? 'User deactivated' : 'User activated');
      fetchUsers();
    } catch { toast.error('Action failed'); }
  };

  const toggleRole = async (u: AdminUser) => {
    try {
      await adminSetUserRoleApi(u.profile_id, u.role === 'admin' ? 'user' : 'admin');
      toast.success(u.role === 'admin' ? 'Admin role removed' : 'User promoted to admin');
      fetchUsers();
    } catch { toast.error('Action failed'); }
  };

  const forceLogout = async (u: AdminUser) => {
    try {
      await adminForceLogoutApi(u.profile_id);
      toast.success('All sessions revoked');
      fetchUsers();
    } catch { toast.error('Action failed'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminDeleteUserApi(deleteTarget.profile_id);
      toast.success('User deleted');
      setDeleteTarget(null);
      fetchUsers();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  const handleReset = async () => {
    if (!resetTarget) return;
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setResetting(true);
    try {
      await adminResetPasswordApi(resetTarget.profile_id, newPassword);
      toast.success('Password reset');
      setResetTarget(null);
      setNewPassword('');
    } catch { toast.error('Reset failed'); }
    finally { setResetting(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input placeholder="Search by name / email / mobile" value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 240 }} />
        <select value={role} onChange={e => setRole(e.target.value)} style={inputStyle}>
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? <FullPageLoader /> : !data || data.users.length === 0 ? (
        <EmptyState title="No users found" description="Try adjusting your search filters." />
      ) : (
        <>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>{data.total} user(s) found</p>
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 900 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  {['ID', 'User', 'Mobile', 'Role', 'Status', 'Income', 'Expense', 'Txns', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#9ca3af', fontWeight: 500, fontSize: 12, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.users.map(u => (
                  <tr key={u.profile_id} style={{ borderBottom: '1px solid #f9fafb' }}>
                    <td style={{ padding: '12px', color: '#9ca3af' }}>{u.profile_id}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600, color: '#374151' }}>{u.name}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '12px', color: '#6b7280' }}>{u.mobile_number}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        background: u.role === 'admin' ? '#f5f3ff' : '#f3f4f6',
                        color: u.role === 'admin' ? '#7c3aed' : '#6b7280',
                      }}>{u.role}</span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        background: u.is_active ? '#ecfdf5' : '#fef2f2',
                        color: u.is_active ? '#059669' : '#dc2626',
                      }}>{u.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td style={{ padding: '12px', color: '#059669' }}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(u.total_income)}</td>
                    <td style={{ padding: '12px', color: '#dc2626' }}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(u.total_expense)}</td>
                    <td style={{ padding: '12px', color: '#6b7280' }}>{u.transaction_count}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button style={btn(u.is_active ? '#ef4444' : '#059669')} onClick={() => toggleStatus(u)}>
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button style={btn(u.role === 'admin' ? '#f59e0b' : '#7c3aed')} onClick={() => toggleRole(u)}>
                          {u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                        </button>
                        <button style={btn('#6b7280')} onClick={() => { setResetTarget(u); setNewPassword(''); }}>Reset PW</button>
                        <button style={btn('#3b82f6')} onClick={() => forceLogout(u)}>Force Logout</button>
                        <button style={btn('#ef4444')} onClick={() => setDeleteTarget(u)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete User"
        message={`This will permanently delete ${deleteTarget?.name || ''} and all their transactions. This cannot be undone.`}
        confirmLabel="Delete User"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      <AnimatePresence>
        {resetTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={() => setResetTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              style={{ background: '#fff', borderRadius: 24, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>Reset Password</h3>
              <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6b7280' }}>
                Set a new password for <strong>{resetTarget.name}</strong>. All their active sessions will be revoked.
              </p>
              <input
                type="password" placeholder="New password (min 6 chars)" value={newPassword}
                onChange={e => setNewPassword(e.target.value)} autoFocus
                style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                <button onClick={() => setResetTarget(null)} disabled={resetting} style={{ padding: '10px 20px', borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', color: '#374151' }}>Cancel</button>
                <button onClick={handleReset} disabled={resetting} style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: '#7c3aed', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#fff', opacity: resetting ? 0.6 : 1 }}>{resetting ? 'Resetting…' : 'Reset Password'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
