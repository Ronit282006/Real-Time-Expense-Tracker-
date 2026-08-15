import { motion } from 'framer-motion';

export function LoadingDots() {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
      <span className="loading-dot" />
      <span className="loading-dot" />
      <span className="loading-dot" />
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{ width: 40, height: 40, border: '4px solid #e5e7eb', borderTopColor: '#7c3aed', borderRadius: '50%' }}
      />
      <p style={{ color: '#6b7280', fontSize: 14 }}>Loading…</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 28, width: '40%', marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 12, width: '80%' }} />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 48, width: '100%' }} />
      ))}
    </div>
  );
}
