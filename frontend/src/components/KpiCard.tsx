import { motion } from 'framer-motion';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon: string;
  delay?: number;
}

export default function KpiCard({ title, value, subtitle, color = '#7c3aed', icon, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.08)' }}
      style={{
        background: '#fff', borderRadius: 20, padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)', flex: 1, minWidth: 200,
        transition: 'box-shadow 0.2s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</p>
          <h2 style={{ margin: '8px 0 4px', fontSize: 28, fontWeight: 700, color }}>{value}</h2>
          {subtitle && <p style={{ margin: 0, fontSize: 12, color: '#d1d5db' }}>{subtitle}</p>}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: `${color}15`, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={icon} />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}
