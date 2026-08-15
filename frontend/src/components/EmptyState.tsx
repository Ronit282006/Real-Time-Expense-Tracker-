import { motion } from 'framer-motion';

interface Props {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ title, description, action }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: 60, gap: 12, textAlign: 'center',
      }}
    >
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: '#374151', margin: 0 }}>{title}</h3>
      {description && <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: 8, padding: '10px 24px', border: 'none', borderRadius: 12,
            background: '#7c3aed', color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', transition: 'background 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#6d28d9')}
          onMouseLeave={e => (e.currentTarget.style.background = '#7c3aed')}
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
