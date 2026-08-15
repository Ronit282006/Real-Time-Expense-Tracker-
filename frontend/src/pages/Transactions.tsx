import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { listTransactionsV1Api, createTransactionApi, updateTransactionApi, deleteTransactionApi } from '../api/client';
import type { Transaction, PaginatedTransactions } from '../types';
import TransactionModal from '../components/TransactionModal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import { FullPageLoader } from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Salary', 'Freelance', 'Investment', 'Healthcare', 'Education', 'Rent', 'Other'];

export default function Transactions() {
  const [data, setData] = useState<PaginatedTransactions | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [order, setOrder] = useState<'desc' | 'asc'>('desc');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const limit = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (filterType) params.transaction_type = filterType;
      if (filterCategory) params.category = filterCategory;
      if (search) params.search = search;
      params.sort_by = sortBy;
      params.order = order;
      const { data: res } = await listTransactionsV1Api(params);
      setData(res);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [page, filterType, filterCategory, search, sortBy, order]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (payload: Record<string, unknown>) => {
    if (editingTxn) {
      await updateTransactionApi(editingTxn.id, payload);
      toast.success('Transaction updated');
    } else {
      await createTransactionApi(payload);
      toast.success('Transaction added');
    }
    setEditingTxn(null);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTransactionApi(deleteTarget.id);
      toast.success('Transaction deleted');
      setDeleteTarget(null);
      fetchData();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  const openEdit = (t: Transaction) => { setEditingTxn(t); setModalOpen(true); };
  const openCreate = () => { setEditingTxn(null); setModalOpen(true); };

  const fm = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Transactions</h1>
          <p style={{ fontSize: 14, color: '#9ca3af', margin: '4px 0 0' }}>Manage your income and expenses</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={openCreate}
          style={{
            padding: '12px 24px', borderRadius: 12, border: 'none',
            background: '#7c3aed', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add Transaction
        </motion.button>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}
          style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, background: '#fff', outline: 'none' }}>
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1); }}
          style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, background: '#fff', outline: 'none' }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="text" placeholder="Search notes…" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', flex: 1, minWidth: 140 }}
        />
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, background: '#fff', outline: 'none' }}>
          <option value="transaction_datetime">Date</option>
          <option value="amount">Amount</option>
        </select>
        <button onClick={() => setOrder(o => o === 'desc' ? 'asc' : 'desc')}
          style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          {order === 'desc' ? '↓ Newest' : '↑ Oldest'}
        </button>
      </div>

      {loading ? (
        <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className="skeleton" style={{ height: 48, width: '100%', marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 48, width: '100%', marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 48, width: '100%', marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 48, width: '100%', marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 48, width: '100%' }} />
        </div>
      ) : data && data.items.length === 0 ? (
        <EmptyState
          title="No transactions found"
          description={filterType || filterCategory || search ? 'Try adjusting your filters' : 'Add your first transaction to get started'}
          action={filterType || filterCategory || search ? undefined : { label: 'Add Transaction', onClick: openCreate }}
        />
      ) : data ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
                    {['Type', 'Amount', 'Category', 'Note', 'Date', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '14px 16px', color: '#9ca3af', fontWeight: 500, fontSize: 12, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((t, i) => (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      style={{ borderBottom: '1px solid #f9fafb' }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                          background: t.type === 'income' ? '#ecfdf5' : '#fef2f2',
                          color: t.type === 'income' ? '#059669' : '#dc2626',
                        }}>
                          {t.type}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: t.type === 'income' ? '#059669' : '#dc2626' }}>
                        {fm(t.amount)}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#6b7280' }}>{t.category}</td>
                      <td style={{ padding: '14px 16px', color: '#9ca3af', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.note || '—'}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                        {new Date(t.transaction_datetime).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => openEdit(t)}
                            style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#6b7280' }}>
                            Edit
                          </button>
                          <button onClick={() => setDeleteTarget(t)}
                            style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#ef4444' }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, color: '#6b7280' }}>
            <span>Page {data.page} of {data.total_pages} ({data.total_records} records)</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                style={{
                  padding: '8px 16px', borderRadius: 10, border: '1px solid #e5e7eb',
                  background: '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: page <= 1 ? 0.5 : 1, fontSize: 13,
                }}>
                Previous
              </button>
              <button disabled={page >= data.total_pages} onClick={() => setPage(p => p + 1)}
                style={{
                  padding: '8px 16px', borderRadius: 10, border: '1px solid #e5e7eb',
                  background: '#fff', cursor: page >= data.total_pages ? 'not-allowed' : 'pointer',
                  opacity: page >= data.total_pages ? 0.5 : 1, fontSize: 13,
                }}>
                Next
              </button>
            </div>
          </div>
        </>
      ) : null}

      <TransactionModal open={modalOpen} onClose={() => { setModalOpen(false); setEditingTxn(null); }} onSave={handleSave} transaction={editingTxn} />
      <ConfirmDialog open={!!deleteTarget} title="Delete Transaction" message="Are you sure? This cannot be undone." onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
    </motion.div>
  );
}
