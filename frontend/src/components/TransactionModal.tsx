import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Transaction } from '../types';

const CATEGORIES = [
  'Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Salary', 'Freelance', 'Investment', 'Healthcare', 'Education', 'Rent', 'Other',
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  transaction?: Transaction | null;
}

export default function TransactionModal({ open, onClose, onSave, transaction }: Props) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(String(transaction.amount));
      setCategory(transaction.category);
      setNote(transaction.note || '');
      const d = new Date(transaction.transaction_datetime);
      setDate(d.toISOString().slice(0, 10));
      setTime(d.toTimeString().slice(0, 5));
    } else {
      setType('expense'); setAmount(''); setCategory(CATEGORIES[0]); setNote('');
      setDate(new Date().toISOString().slice(0, 10));
      setTime(new Date().toTimeString().slice(0, 5));
    }
  }, [transaction, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !date || !time) return;
    setSaving(true);
    try {
      await onSave({
        type,
        amount: Number(amount),
        category,
        note: note || undefined,
        transaction_datetime: `${date}T${time}:00`,
      });
      onClose();
    } catch { /* toast handled by caller */ }
    finally { setSaving(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="p-5 md:p-8"
            style={{ background: '#fff', borderRadius: 24, maxWidth: 480, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', boxSizing: 'border-box' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700 }}>{transaction ? 'Edit Transaction' : 'Add Transaction'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 8, background: '#f3f4f6', borderRadius: 12, padding: 4 }}>
                {(['expense', 'income'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                      background: type === t ? '#fff' : 'transparent',
                      color: type === t ? (t === 'expense' ? '#ef4444' : '#10b981') : '#6b7280',
                      fontWeight: 600, fontSize: 14, cursor: 'pointer',
                      boxShadow: type === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    {t === 'expense' ? '💸 Expense' : '💰 Income'}
                  </button>
                ))}
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#6b7280', marginBottom: 6, display: 'block' }}>Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0"
                  required
                  min="1"
                  style={{
                    width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb',
                    borderRadius: 12, fontSize: 16, fontWeight: 600, outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#6b7280', marginBottom: 6, display: 'block' }}>Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb',
                    borderRadius: 12, fontSize: 14, outline: 'none',
                    background: '#fff',
                  }}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#6b7280', marginBottom: 6, display: 'block' }}>Note (optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add a note…"
                  maxLength={255}
                  style={{
                    width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb',
                    borderRadius: 12, fontSize: 14, outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div className="flex flex-col sm:flex-row" style={{ gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#6b7280', marginBottom: 6, display: 'block' }}>Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    style={{
                      width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb',
                      borderRadius: 12, fontSize: 14, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#6b7280', marginBottom: 6, display: 'block' }}>Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    required
                    style={{
                      width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb',
                      borderRadius: 12, fontSize: 14, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row" style={{ gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 12, border: '1px solid #e5e7eb',
                    background: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', color: '#374151',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 12, border: 'none',
                    background: '#7c3aed', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#fff',
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? 'Saving…' : transaction ? 'Update' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
