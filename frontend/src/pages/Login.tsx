import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { loginApi, getMeApi, googleLoginApi } from '../api/client';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { setToken, setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const { data } = await loginApi(email, password);
      setToken(data.access_token);
      try {
        const me = await getMeApi();
        setUser(me.data);
      } catch { /* role unknown is fine; profile resolves later */ }
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      toast.error('Google sign-in failed');
      return;
    }
    setGoogleLoading(true);
    try {
      const { data } = await googleLoginApi(credentialResponse.credential);
      setToken(data.access_token);
      try {
        const me = await getMeApi();
        setUser(me.data);
      } catch { /* profile resolves later */ }
      toast.success('Welcome!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f0eb', padding: 16 }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-6 md:p-10"
        style={{
          background: '#fff', borderRadius: 28, maxWidth: 400, width: '100%',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)', position: 'relative' as const, boxSizing: 'border-box',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ fontSize: 40 }}>💰</span>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '12px 0 4px' }}>Welcome Back</h1>
          <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>Sign in to your expense manager</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#6b7280', marginBottom: 6, display: 'block' }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required
              style={{
                width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: 12,
                fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#7c3aed'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#6b7280', marginBottom: 6, display: 'block' }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required
              style={{
                width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: 12,
                fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#7c3aed'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <motion.button
            type="submit" disabled={loading}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: '14px', borderRadius: 12, border: 'none',
              background: loading ? '#a78bfa' : '#7c3aed', color: '#fff',
              fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 8, transition: 'background 0.2s',
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </motion.button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        </div>

        {/* Google Sign-In */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            text="signin_with"
          />
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#9ca3af', marginTop: 24 }}>
          Don&apos;t have an account?{' '}
          <Link to="/register" style={{ color: '#7c3aed', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
        </p>

        {/* Google Loading Overlay */}
        <AnimatePresence>
          {googleLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute', inset: 0, borderRadius: 28,
                background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                zIndex: 10,
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                style={{
                  width: 40, height: 40, borderRadius: '50%',
                  border: '3px solid #e5e7eb', borderTopColor: '#7c3aed',
                  marginBottom: 16,
                }}
              />
              <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: 0 }}>
                Signing in with Google…
              </p>
              <p style={{ fontSize: 13, color: '#9ca3af', margin: '6px 0 0' }}>
                Please wait a moment
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
