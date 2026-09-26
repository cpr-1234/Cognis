import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoogleAuthButton } from './GoogleAuthButton';

export const LoginForm = ({ onSuccess }) => {
  const { login, isActionLoading, error, successMsg, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState(() => localStorage.getItem('cognis_remembered_email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('cognis_remembered_email'));

  // If already authenticated (or upon Google Sign-In success), redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      if (onSuccess) onSuccess();
      else navigate('/researcher/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate, onSuccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    if (rememberMe) {
      localStorage.setItem('cognis_remembered_email', email.trim());
    } else {
      localStorage.removeItem('cognis_remembered_email');
    }
    const res = await login(email, password);
    if (res?.success) {
      if (onSuccess) onSuccess();
      else navigate('/researcher/dashboard');
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Symmetrical Notifications */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          borderRadius: '8px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.28)',
          color: '#fca5a5',
          fontSize: 13,
          marginBottom: 16,
          textAlign: 'left'
        }} role="alert">
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <div>{error}</div>
        </div>
      )}

      {successMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          borderRadius: '8px',
          background: 'rgba(34, 197, 94, 0.12)',
          border: '1px solid rgba(34, 197, 94, 0.28)',
          color: '#86efac',
          fontSize: 13,
          marginBottom: 16,
          textAlign: 'left'
        }} role="alert">
          <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
          <div>{successMsg}</div>
        </div>
      )}

      {/* Symmetrical Google OAuth Section */}
      <GoogleAuthButton isActionLoading={isActionLoading} />

      {/* Symmetrical Divider */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        margin: '18px 0',
        color: 'var(--text-muted)',
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        <span style={{ padding: '0 12px' }}>or sign in with email</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      </div>

      {/* Email / Password Form */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label className="auth-label" htmlFor="login-email">
            Institutional or Academic Email
          </label>
          <input
            id="login-email"
            type="email"
            className="auth-input"
            placeholder="e.g. dr.curie@research.ac.uk"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="login-password">
            Password
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              className="auth-input"
              style={{ paddingRight: '40px' }}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              style={{
                position: 'absolute',
                right: '12px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px'
              }}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', margin: '4px 0 16px 0' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ accentColor: 'var(--accent)', width: '15px', height: '15px', cursor: 'pointer' }}
            />
            <span>Remember me</span>
          </label>
        </div>

        <button
          type="submit"
          className="auth-submit"
          disabled={isActionLoading || !email.trim() || !password}
        >
          {isActionLoading ? (
            <>
              <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In to Researcher Portal</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

