import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProfileApi, updateProfileApi, deleteProfileApi, verifyEmailChangeOtpApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { FullPageLoader } from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const OTP_LENGTH = 6;

function getUserIdFromToken(): number | null {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub ? Number(payload.sub) : null;
  } catch { return null; }
}

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', mobile_number: '' });
  const [originalEmail, setOriginalEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Email-change OTP state
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [pendingNewEmail, setPendingNewEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const profileId = user?.profile_id ?? getUserIdFromToken();
    if (!profileId) return;
    getProfileApi(profileId)
      .then(r => {
        const u = r.data;
        setForm({ name: u.name, email: u.email, mobile_number: u.mobile_number });
        setOriginalEmail(u.email);
        setUser(u);
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const { data } = await updateProfileApi(user.profile_id, form);

      // Check if email change triggered OTP
      if (data.pending_field === 'email') {
        toast.success('Verification code sent to your new email!');
        setPendingNewEmail(form.email);
        setOtpDigits(Array(OTP_LENGTH).fill(''));
        setOtpModalOpen(true);
        // Revert email in form to old value (not yet changed)
        setForm(f => ({ ...f, email: originalEmail }));
        // Update name/mobile from the profile returned
        if (data.profile) {
          setUser(data.profile);
        }
        setTimeout(() => otpInputRefs.current[0]?.focus(), 200);
      } else {
        setUser(data);
        setOriginalEmail(data.email);
        toast.success('Profile updated');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  // OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    if (value && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
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
    otpInputRefs.current[nextIndex]?.focus();
  };

  const handleVerifyEmailOtp = async () => {
    const otp = otpDigits.join('');
    if (otp.length !== OTP_LENGTH) { toast.error('Please enter the full 6-digit code'); return; }
    setVerifyingOtp(true);
    try {
      const { data } = await verifyEmailChangeOtpApi(pendingNewEmail, otp);
      setUser(data);
      setForm({ name: data.name, email: data.email, mobile_number: data.mobile_number });
      setOriginalEmail(data.email);
      setOtpModalOpen(false);
      toast.success('Email updated successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Verification failed');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await deleteProfileApi(user.profile_id);
      toast.success('Account deleted');
      logout();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <FullPageLoader />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 560, margin: '0 auto' }}>
      <motion.div
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        style={{ background: '#fff', borderRadius: 24, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 700, color: '#7c3aed',
          }}>
            {form.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Profile</h1>
            <p style={{ fontSize: 14, color: '#9ca3af', margin: '2px 0 0' }}>Manage your account</p>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#6b7280', marginBottom: 6, display: 'block' }}>Name</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
              style={{
                width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: 12,
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#7c3aed'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#6b7280', marginBottom: 6, display: 'block' }}>
              Email
              {form.email.toLowerCase() !== originalEmail.toLowerCase() && (
                <span style={{ color: '#f59e0b', fontSize: 11, marginLeft: 8, fontWeight: 400 }}>
                  ⚠ Changing email requires verification
                </span>
              )}
            </label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
              style={{
                width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: 12,
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#7c3aed'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#6b7280', marginBottom: 6, display: 'block' }}>Mobile Number</label>
            <input type="tel" value={form.mobile_number} onChange={e => setForm(f => ({ ...f, mobile_number: e.target.value }))} required
              style={{
                width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: 12,
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#7c3aed'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <motion.button type="submit" disabled={saving} whileTap={{ scale: 0.97 }}
              style={{
                flex: 1, padding: '12px', borderRadius: 12, border: 'none',
                background: saving ? '#a78bfa' : '#7c3aed', color: '#fff',
                fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
              }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </motion.button>
            <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => setDeleteOpen(true)}
              style={{
                padding: '12px 24px', borderRadius: 12, border: '1px solid #fecaca',
                background: '#fff', color: '#ef4444', fontSize: 14, fontWeight: 500, cursor: 'pointer',
              }}>
              Delete Account
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* Email Change OTP Modal */}
      <AnimatePresence>
        {otpModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, padding: 16,
            }}
            onClick={() => setOtpModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#fff', borderRadius: 24, padding: 36, maxWidth: 400, width: '100%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <span style={{ fontSize: 36 }}>📧</span>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: '12px 0 4px' }}>Verify New Email</h2>
                <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
                  Enter the code sent to <strong style={{ color: '#374151' }}>{pendingNewEmail}</strong>
                </p>
              </div>

              {/* OTP Inputs */}
              <div
                style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}
                onPaste={handleOtpPaste}
              >
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { otpInputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    style={{
                      width: 44, height: 52, textAlign: 'center', fontSize: 20, fontWeight: 700,
                      border: digit ? '2px solid #7c3aed' : '2px solid #e5e7eb',
                      borderRadius: 10, outline: 'none', transition: 'border-color 0.2s',
                      color: '#1f2937', background: digit ? '#f5f3ff' : '#fff',
                    }}
                    onFocus={e => e.target.style.borderColor = '#7c3aed'}
                    onBlur={e => { if (!digit) e.target.style.borderColor = '#e5e7eb'; }}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <motion.button
                  onClick={() => setOtpModalOpen(false)}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 12,
                    border: '1px solid #e5e7eb', background: '#fff',
                    color: '#6b7280', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleVerifyEmailOtp}
                  disabled={verifyingOtp || otpDigits.join('').length !== OTP_LENGTH}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 12, border: 'none',
                    background: verifyingOtp ? '#a78bfa' : '#7c3aed', color: '#fff',
                    fontSize: 14, fontWeight: 600, cursor: verifyingOtp ? 'not-allowed' : 'pointer',
                    opacity: otpDigits.join('').length !== OTP_LENGTH ? 0.6 : 1,
                  }}
                >
                  {verifyingOtp ? 'Verifying…' : 'Confirm'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Account"
        message="This will permanently delete your account and all transactions. Are you sure?"
        confirmLabel="Delete My Account"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        loading={deleting}
      />
    </motion.div>
  );
}
