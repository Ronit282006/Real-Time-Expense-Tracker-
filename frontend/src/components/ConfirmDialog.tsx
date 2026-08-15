import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel, loading }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            style={{ background: '#fff', borderRadius: 20, padding: 32, maxWidth: 400, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>{title}</h3>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6b7280', lineHeight: 1.5 }}>{message}</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={onCancel}
                disabled={loading}
                style={{
                  padding: '10px 20px', borderRadius: 12, border: '1px solid #e5e7eb',
                  background: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', color: '#374151',
                }}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                style={{
                  padding: '10px 24px', borderRadius: 12, border: 'none',
                  background: '#ef4444', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#fff',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? 'Processing…' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
