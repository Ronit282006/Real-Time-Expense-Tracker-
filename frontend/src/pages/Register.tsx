import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { registerApi, verifyRegistrationOtpApi, resendRegistrationOtpApi, googleLoginApi, getMeApi } from '../api/client';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', mobile_number: '', re_enter_password: '' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const { setToken, setUser } = useAuth();
  const navigate = useNavigate();

  // OTP state
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // Step 1: Submit registration form → send OTP
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.re_enter_password) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await registerApi(form);
      toast.success('Verification code sent to your email!');
      setStep('otp');
      setResendCooldown(RESEND_COOLDOWN);
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // OTP digit input handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const newDigits = [...otpDigits];
    for (let i = 0; i < pasted.length; i++) newDigits[i] = pasted[i];
    setOtpDigits(newDigits);
    const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    const otp = otpDigits.join('');
    if (otp.length !== OTP_LENGTH) { toast.error('Please enter the full 6-digit code'); return; }
    setVerifying(true);
    try {
      await verifyRegistrationOtpApi(form.email, otp);
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    try {
      await resendRegistrationOtpApi(form.email);
      toast.success('New code sent!');
      setResendCooldown(RESEND_COOLDOWN);
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to resend code');
    }
  };

  // Google Sign-In (skips OTP — Google already verified the email)
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
      toast.success('Account created! Welcome!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };
  const fields = [
    { name: 'name', label: 'Name', type: 'text', placeholder: 'John Doe' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
    { name: 'mobile_number', label: 'Mobile', type: 'tel', placeholder: '+1 234 567 890' },
    { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
    { name: 're_enter_password', label: 'Confirm Password', type: 'password', placeholder: '••••••••' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f0eb', padding: 16 }}>
      <AnimatePresence mode="wait">
        {step === 'form' ? (
          <motion.div
            key="register-form"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="p-6 md:p-10"
            style={{
              background: '#fff', borderRadius: 28, maxWidth: 420, width: '100%',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)', position: 'relative' as const, boxSizing: 'border-box',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <span style={{ fontSize: 40 }}>📝</span>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: '12px 0 4px' }}>Create Account</h1>
              <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>Start managing your expenses</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {fields.map(f => (
                <div key={f.name}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#6b7280', marginBottom: 4, display: 'block' }}>{f.label}</label>
                  <input
                    {...f} name={f.name} value={(form as any)[f.name]} onChange={handleChange} required
                    style={{
                      width: '100%', padding: '11px 16px', border: '1px solid #e5e7eb', borderRadius: 12,
                      fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor = '#7c3aed'}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
              ))}

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
                {loading ? 'Sending code…' : 'Create Account'}
              </motion.button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
              <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>or</span>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            </div>

            {/* Google Sign-In */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <GoogleSignInButton
                onSuccess={handleGoogleSuccess}
                text="signup_with"
              />
            </div>

            <p style={{ textAlign: 'center', fontSize: 14, color: '#9ca3af', marginTop: 20 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#7c3aed', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
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
                    Creating account with Google…
                  </p>
                  <p style={{ fontSize: 13, color: '#9ca3af', margin: '6px 0 0' }}>
                    Please wait a moment
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="otp-verify"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="p-6 md:p-10"
            style={{
              background: '#fff', borderRadius: 28, maxWidth: 420, width: '100%',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)', boxSizing: 'border-box',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <span style={{ fontSize: 40 }}>🔐</span>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: '12px 0 4px' }}>Verify Your Email</h1>
              <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>
                We sent a 6-digit code to <strong style={{ color: '#374151' }}>{form.email}</strong>
              </p>
            </div>

            {/* OTP Input Boxes */}
            <div
              style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24 }}
              onPaste={handleOtpPaste}
            >
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  style={{
                    flex: 1, minWidth: 0, maxWidth: 52, aspectRatio: '1', textAlign: 'center',
                    fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 700,
                    border: digit ? '2px solid #7c3aed' : '2px solid #e5e7eb',
                    borderRadius: 12, outline: 'none', transition: 'border-color 0.2s',
                    color: '#1f2937', background: digit ? '#f5f3ff' : '#fff',
                  }}
                  onFocus={e => e.target.style.borderColor = '#7c3aed'}
                  onBlur={e => { if (!digit) e.target.style.borderColor = '#e5e7eb'; }}
                />
              ))}
            </div>

            {/* Verify Button */}
            <motion.button
              onClick={handleVerifyOtp}
              disabled={verifying || otpDigits.join('').length !== OTP_LENGTH}
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: verifying ? '#a78bfa' : '#7c3aed', color: '#fff',
                fontSize: 15, fontWeight: 600,
                cursor: verifying ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
                opacity: otpDigits.join('').length !== OTP_LENGTH ? 0.6 : 1,
              }}
            >
              {verifying ? 'Verifying…' : 'Verify & Create Account'}
            </motion.button>

            {/* Resend / Back */}
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              {resendCooldown > 0 ? (
                <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>
                  Resend code in <strong style={{ color: '#7c3aed' }}>{resendCooldown}s</strong>
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  style={{
                    background: 'none', border: 'none', color: '#7c3aed',
                    fontWeight: 600, fontSize: 14, cursor: 'pointer', padding: 0,
                  }}
                >
                  Resend Code
                </button>
              )}
              <button
                onClick={() => setStep('form')}
                style={{
                  background: 'none', border: 'none', color: '#9ca3af',
                  fontSize: 13, cursor: 'pointer', marginTop: 12, display: 'block',
                  marginLeft: 'auto', marginRight: 'auto',
                }}
              >
                ← Back to registration
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
