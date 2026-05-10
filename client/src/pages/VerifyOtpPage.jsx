import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  // Redirect if no email passed
  useEffect(() => {
    if (!email) navigate('/register');
  }, [email, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // only digits
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp: code });
      localStorage.setItem('token', data.token);
      useAuthStore.setState({ user: data.user, token: data.token });
      setSuccess('Email verified! Redirecting...');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');
    try {
      await api.post('/auth/resend-otp', { email });
      setSuccess('New OTP sent to your email!');
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
    }}>
      <div style={{
        background: '#1a1a2e',
        borderRadius: '16px',
        padding: '48px 40px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: '#6c63ff', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 24, margin: '0 auto 24px',
        }}>✉️</div>

        <h2 style={{ color: '#fff', marginBottom: 8 }}>Check your email</h2>
        <p style={{ color: '#888', marginBottom: 8, fontSize: 14 }}>
          We sent a 6-digit code to
        </p>
        <p style={{ color: '#6c63ff', marginBottom: 32, fontWeight: 'bold' }}>
          {email}
        </p>

        {/* OTP Input Boxes */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              style={{
                width: 48, height: 56,
                textAlign: 'center',
                fontSize: 24, fontWeight: 'bold',
                background: '#0f0f1a',
                border: `2px solid ${digit ? '#6c63ff' : '#333'}`,
                borderRadius: 10,
                color: '#fff',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
          ))}
        </div>

        {/* Error / Success */}
        {error && (
          <p style={{ color: '#e05a5a', fontSize: 14, marginBottom: 16 }}>{error}</p>
        )}
        {success && (
          <p style={{ color: '#4cbf9a', fontSize: 14, marginBottom: 16 }}>{success}</p>
        )}

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={loading}
          style={{
            width: '100%', padding: '14px',
            background: loading ? '#444' : '#6c63ff',
            color: '#fff', border: 'none',
            borderRadius: 10, fontSize: 16,
            fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: 16, transition: 'background 0.2s',
          }}
        >
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>

        {/* Resend */}
        <p style={{ color: '#666', fontSize: 14 }}>
          Didn't receive the code?{' '}
          {countdown > 0 ? (
            <span style={{ color: '#888' }}>Resend in {countdown}s</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resendLoading}
              style={{
                background: 'none', border: 'none',
                color: '#6c63ff', cursor: 'pointer',
                fontSize: 14, fontWeight: 'bold',
                textDecoration: 'underline',
              }}
            >
              {resendLoading ? 'Sending...' : 'Resend OTP'}
            </button>
          )}
        </p>

        <button
          onClick={() => navigate('/register')}
          style={{
            background: 'none', border: 'none',
            color: '#555', cursor: 'pointer',
            fontSize: 13, marginTop: 16,
          }}
        >
          ← Back to Register
        </button>
      </div>
    </div>
  );
}