import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleAuthButton } from './GoogleAuthButton';

export const LoginForm = () => {
  const { login, isActionLoading, error, successMsg } = useAuth();
  const [email, setEmail] = useState(() => localStorage.getItem('cognis_remembered_email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('cognis_remembered_email'));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    if (rememberMe) {
      localStorage.setItem('cognis_remembered_email', email.trim());
    } else {
      localStorage.removeItem('cognis_remembered_email');
    }
    await login(email, password);
  };

  return (
    <div>
      {/* Notifications */}
      {error && (
        <div className="alert-banner alert-error" role="alert">
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18" style={{ flexShrink: 0 }}>
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>{error}</div>
        </div>
      )}

      {successMsg && (
        <div className="alert-banner alert-success" role="alert">
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18" style={{ flexShrink: 0 }}>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>{successMsg}</div>
        </div>
      )}

      {/* Google OAuth Section */}
      <GoogleAuthButton isActionLoading={isActionLoading} />

      <div className="auth-divider">
        <span>or sign in with email</span>
      </div>

      {/* Email / Password Form */}
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="login-email">
            Institutional or Academic Email
          </label>
          <div className="input-wrapper">
            <span className="input-icon">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </span>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="e.g. dr.curie@research.ac.uk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
        </div>

        <div className="form-group">
          <div className="form-label-row">
            <label className="form-label" htmlFor="login-password">
              Password
            </label>
            <a href="#forgot" className="link-subtle" onClick={(e) => { e.preventDefault(); alert('Please contact your institutional IT administrator or reset password via your identity provider.'); }}>
              Forgot password?
            </a>
          </div>
          <div className="input-wrapper">
            <span className="input-icon">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="input-btn-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" x2="22" y1="2" y2="22" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="form-extras">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Remember me</span>
          </label>
        </div>

        <button
          type="submit"
          className="btn-submit"
          disabled={isActionLoading || !email.trim() || !password}
        >
          {isActionLoading ? (
            <>
              <span className="spinner" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In to Researcher Portal</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
