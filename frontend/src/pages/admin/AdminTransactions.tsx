import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  adminTransactionsApi, adminSuspiciousApi, adminUpdateTransactionApi, adminDeleteTransactionApi,
} from '../../api/client';
import type { AdminTransaction, AdminTransactionList, SuspiciousList } from '../../types';
import type { Transaction } from '../../types';
import TransactionModal from '../../components/TransactionModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { FullPageLoader } from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import toast from 'react-hot-toast';

const inputStyle: React.CSSProperties = {
  padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: 10,
  fontSize: 14, outline: 'none', background: '#fff',
};

const btn = (color: string, solid = false): React.CSSProperties => ({
  padding: '7px 14px', borderRadius: 10, border: solid ? 'none' : '1px solid #e5e7eb',
  background: solid ? color : '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer',
  color: solid ? '#fff' : color, transition: 'all 0.2s',
});

const fm = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export default function AdminTransactions() {
  const [tab, setTab] = useState<'browse' | 'suspicious'>('browse');

  // browse state
  const [data, setData] = useState<AdminTransactionList | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // suspicious state
  const [suspicious, setSuspicious] = useState<SuspiciousList | null>(null);
  const [suspLoading, setSuspLoading] = useState(false);
  const [threshold, setThreshold] = useState('');
  const [suspLimit, setSuspLimit] = useState(20);

  const [editTarget, setEditTarget] = useState<AdminTransaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminTransaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTransactions = useCallback(() => {
    setLoading(true);
    const params: Record<string, string | number> = { skip: 0, limit: 200 };
    if (userId) params.user_id = userId;
    if (type) params.type = type;
    if (category) params.category = category;
    if (minAmount) params.min_amount = Number(minAmount);
    if (maxAmount) params.max_amount = Number(maxAmount);
    adminTransactionsApi(params)
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load transactions'))
      .finally(() => setLoading(false));
  }, [userId, type, category, minAmount, maxAmount]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const scanSuspicious = async () => {
    setSuspLoading(true);
    setSuspicious(null);
    try {
      const params: Record<string, string | number> = { limit: suspLimit };
      if (threshold) params.threshold = Number(threshold);
      const r = await adminSuspiciousApi(params);
      setSuspicious(r.data);
    } catch { toast.error('Scan failed'); }
    finally { setSuspLoading(false); }
  };

  const handleEdit = async (data: Record<string, unknown>) => {
    if (!editTarget) return;
    await adminUpdateTransactionApi(editTarget.id, data);
    toast.success('Transaction updated');
    setEditTarget(null);
    fetchTransactions();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminDeleteTransactionApi(deleteTarget.id);
      toast.success('Transaction deleted');
      setDeleteTarget(null);
      fetchTransactions();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  const renderTable = (rows: AdminTransaction[], caption: string) => (
    <>
      <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>{caption}</p>
      <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 950 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
              {['ID', 'User', 'Type', 'Category', 'Amount', 'Note', 'Date', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#9ca3af', fontWeight: 500, fontSize: 12, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                <td style={{ padding: '12px', color: '#9ca3af' }}>{t.id}</td>
                <td style={{ padding: '12px' }}>
                  <div style={{ fontWeight: 600, color: '#374151' }}>{t.user_name}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{t.user_email}</div>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: t.type === 'income' ? '#ecfdf5' : '#fef2f2',
                    color: t.type === 'income' ? '#059669' : '#dc2626',
                  }}>{t.type}</span>
                </td>
                <td style={{ padding: '12px', color: '#6b7280' }}>{t.category}</td>
                <td style={{ padding: '12px', fontWeight: 600, color: t.type === 'income' ? '#059669' : '#dc2626' }}>{fm(t.amount)}</td>
                <td style={{ padding: '12px', color: '#9ca3af', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.note || '—'}</td>
                <td style={{ padding: '12px', color: '#6b7280' }}>{new Date(t.transaction_datetime).toLocaleDateString()}</td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={btn('#7c3aed')} onClick={() => setEditTarget(t)}>Edit</button>
                    <button style={btn('#ef4444')} onClick={() => setDeleteTarget(t)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, background: '#fff', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {(['browse', 'suspicious'] as const).map(t => (
          <button
            key={t} onClick={() => setTab(t)}
            style={{
              padding: '10px 24px', borderRadius: 10, border: 'none',
              background: tab === t ? '#7c3aed' : 'transparent',
              color: tab === t ? '#fff' : '#6b7280', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {t === 'browse' ? 'Browse All' : '🕵️ Suspicious'}
          </button>
        ))}
      </div>

      {tab === 'browse' ? (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input placeholder="User ID" value={userId} onChange={e => setUserId(e.target.value)} style={{ ...inputStyle, width: 110 }} />
            <select value={type} onChange={e => setType(e.target.value)} style={inputStyle}>
              <option value="">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <input placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} style={inputStyle} />
            <input placeholder="Min amount" type="number" value={minAmount} onChange={e => setMinAmount(e.target.value)} style={{ ...inputStyle, width: 120 }} />
            <input placeholder="Max amount" type="number" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} style={{ ...inputStyle, width: 120 }} />
          </div>

          {loading ? <FullPageLoader /> : !data || data.transactions.length === 0 ? (
            <EmptyState title="No transactions found" description="Try adjusting your filters." />
          ) : (
            renderTable(data.transactions, `${data.total} transaction(s) found`)
          )}
        </>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <input placeholder="Custom threshold (blank = auto)" type="number" value={threshold} onChange={e => setThreshold(e.target.value)} style={{ ...inputStyle, width: 240 }} />
            <input placeholder="Limit" type="number" value={suspLimit} onChange={e => setSuspLimit(Number(e.target.value) || 20)} style={{ ...inputStyle, width: 90 }} />
            <button onClick={scanSuspicious} disabled={suspLoading} style={btn('#7c3aed', true)}>{suspLoading ? 'Scanning…' : '🔍 Scan for Suspicious'}</button>
          </div>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Flags expenses above the anomaly threshold (mean + 2× std dev of all expenses).</p>

          {suspLoading ? <FullPageLoader /> : suspicious && (
            suspicious.transactions.length === 0 ? (
              <EmptyState title="No suspicious transactions found" description={`Threshold was ${fm(suspicious.threshold)}.`} />
            ) : (
              <>
                <p style={{ fontSize: 13, margin: 0 }}>Detected threshold: <strong>{fm(suspicious.threshold)}</strong> · {suspicious.count} flagged</p>
                {renderTable(suspicious.transactions.map(s => s.transaction), `${suspicious.count} suspicious transaction(s)`)}
              </>
            )
          )}
        </>
      )}

      <TransactionModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleEdit}
        transaction={(editTarget as Transaction) || null}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Transaction"
        message={`Delete transaction #${deleteTarget?.id} (${deleteTarget?.category}, ${fm(deleteTarget?.amount || 0)}) for ${deleteTarget?.user_name}?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </motion.div>
  );
}
