import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/transactions', label: 'Transactions', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { to: '/import', label: 'Import', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
  { to: '/profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
];

const adminLinks = [
  { to: '/admin', label: 'Admin', icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998a12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222' },
];

const desktopLinkStyle = (isActive: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '8px 14px', borderRadius: 10,
  fontSize: 14, fontWeight: 500,
  textDecoration: 'none',
  color: isActive ? '#7c3aed' : '#6b7280',
  background: isActive ? '#f5f3ff' : 'transparent',
  transition: 'all 0.2s',
});

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const visibleLinks = user?.role === 'admin' ? [...links, ...adminLinks] : links;

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: '0 16px', height: 64, display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#7c3aed', letterSpacing: '-0.5px' }}>
          💰 Finance
        </span>
        <div className="hidden lg:flex" style={{ alignItems: 'center', gap: 4 }}>
          {visibleLinks.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              style={({ isActive }) => desktopLinkStyle(isActive)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={l.icon} />
              </svg>
              {l.label}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="hidden lg:flex" style={{ alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 14, color: '#6b7280' }}>{user?.name || 'User'}</span>
        <button
          onClick={logout}
          style={{
            padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: 10,
            background: 'transparent', fontSize: 14, color: '#6b7280',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280'; }}
        >
          Logout
        </button>
      </div>

      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle menu"
        className="flex lg:hidden"
        style={{
          flexDirection: 'column', justifyContent: 'center',
          alignItems: 'center', width: 40, height: 40, borderRadius: 10,
          border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', gap: 5,
        }}
      >
        <span style={{ width: 18, height: 2, background: '#374151', borderRadius: 2, transition: 'all 0.2s', transform: open ? 'rotate(45deg) translateY(7px)' : 'none' }} />
        <span style={{ width: 18, height: 2, background: '#374151', borderRadius: 2, transition: 'all 0.2s', opacity: open ? 0 : 1 }} />
        <span style={{ width: 18, height: 2, background: '#374151', borderRadius: 2, transition: 'all 0.2s', transform: open ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex lg:hidden"
            style={{
              position: 'fixed', top: 64, left: 0, right: 0,
              background: '#fff', borderBottom: '1px solid #e5e7eb',
              boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
              padding: '8px 12px 12px', flexDirection: 'column', gap: 2,
              zIndex: 49,
            }}
          >
            {visibleLinks.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px', borderRadius: 10,
                  fontSize: 15, fontWeight: 500, textDecoration: 'none',
                  color: isActive ? '#7c3aed' : '#374151',
                  background: isActive ? '#f5f3ff' : 'transparent',
                })}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={l.icon} />
                </svg>
                {l.label}
              </NavLink>
            ))}
            <div style={{ borderTop: '1px solid #f3f4f6', marginTop: 8, paddingTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, color: '#6b7280', paddingLeft: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'User'}
              </span>
              <button
                onClick={logout}
                style={{
                  padding: '10px 16px', border: '1px solid #fecaca', borderRadius: 10,
                  background: '#fff', fontSize: 14, color: '#ef4444', cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
