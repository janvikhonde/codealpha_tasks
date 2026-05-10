// 📁 client/src/pages/LoginPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const { login, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email.trim(), password);
    if (result === true) {
      navigate('/');
    } else if (result?.unverified) {
      // User registered but never verified OTP — send them to verify
      navigate('/verify-otp', { state: { email: result.email } });
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex w-1/2 bg-dark-800 border-r border-dark-500 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Glow effects */}
        <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-brand/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-green-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 text-center max-w-sm">
          <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-6 shadow-lg shadow-brand/30">
            N
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Nexus PM</h1>
          <p className="text-gray-500 text-sm mb-10 leading-relaxed">
            The collaborative project management tool built for modern dev teams — with AI, real-time updates, and everything your team needs.
          </p>

          {/* Feature highlights */}
          <div className="space-y-3 text-left">
            {[
              { icon: '✨', label: 'AI-powered task breakdown via Claude' },
              { icon: '🔄', label: 'Real-time board updates with WebSockets' },
              { icon: '🎙', label: 'Voice notes on any task' },
              { icon: '📈', label: 'Sprint burndown charts' },
              { icon: '😊', label: 'Team mood check-ins' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3 text-sm text-gray-400">
                <span className="text-base w-6 text-center">{f.icon}</span>
                {f.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center text-white font-bold">N</div>
            <span className="text-xl font-semibold text-white">Nexus PM</span>
          </div>

          <h2 className="text-2xl font-semibold text-white mb-1">Welcome back</h2>
          <p className="text-gray-500 text-sm mb-6">Sign in to continue to your workspace</p>

          {/* Error alert */}
          {error && (
            <div className="flex items-start gap-2 bg-red-900/30 border border-red-800 text-red-400 text-sm px-3 py-2.5 rounded-lg mb-5">
              <span className="mt-0.5">⚠</span>
              <span className="flex-1">{error}</span>
              <button onClick={clearError} className="text-red-500 hover:text-red-300 ml-1 leading-none">✕</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 text-xs"
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-gray-600 text-sm">Don't have an account? </span>
            <Link to="/register" className="text-brand hover:text-brand-light text-sm font-medium transition-colors">
              Create one free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}