import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoogleAuthButton } from './GoogleAuthButton';

export const RegisterForm = ({ onSwitchToLogin, onSuccess }) => {
  const { register, isActionLoading, error, successMsg, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    institution: '',
    fieldOfStudy: '',
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      if (onSuccess) onSuccess();
      else navigate('/researcher/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate, onSuccess]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Password strength calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    return score;
  };

  const strength = getPasswordStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) return;
    const res = await register(formData);
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
        <span style={{ padding: '0 12px' }}>or register with institutional profile</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Full Name */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="reg-name">
            Researcher Full Name & Title
          </label>
          <input
            id="reg-name"
            name="name"
            type="text"
            className="auth-input"
            placeholder="e.g. Dr. Sarah Connor, Ph.D."
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        {/* Email */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="reg-email">
            Academic / Institutional Email
          </label>
          <input
            id="reg-email"
            name="email"
            type="email"
            className="auth-input"
            placeholder="s.connor@harvard.edu"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        {/* Institution & Field in symmetrical two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div style={{ textAlign: 'left' }}>
            <label className="auth-label" htmlFor="reg-institution">
              Institution / Lab
            </label>
            <input
              id="reg-institution"
              name="institution"
              type="text"
              className="auth-input"
              placeholder="e.g. Max Planck Inst."
              value={formData.institution}
              onChange={handleChange}
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label className="auth-label" htmlFor="reg-field">
              Field of Research
            </label>
            <input
              id="reg-field"
              name="fieldOfStudy"
              type="text"
              className="auth-input"
              placeholder="e.g. Cognitive AI"
              value={formData.fieldOfStudy}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Password */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="reg-password">
            Secure Access Password
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              id="reg-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className="auth-input"
              style={{ paddingRight: '40px' }}
              placeholder="Min. 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
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

          {/* Password Strength Indicator */}
          {formData.password && (
            <div style={{ display: 'flex', gap: '4px', marginTop: '6px', height: '3px' }}>
              <div style={{ flex: 1, borderRadius: '2px', background: strength >= 1 ? (strength <= 1 ? '#f87171' : strength <= 2 ? '#fbbf24' : '#4ade80') : 'rgba(255,255,255,0.1)' }} />
              <div style={{ flex: 1, borderRadius: '2px', background: strength >= 2 ? (strength <= 2 ? '#fbbf24' : '#4ade80') : 'rgba(255,255,255,0.1)' }} />
              <div style={{ flex: 1, borderRadius: '2px', background: strength >= 3 ? '#4ade80' : 'rgba(255,255,255,0.1)' }} />
              <div style={{ flex: 1, borderRadius: '2px', background: strength >= 4 ? '#4ade80' : 'rgba(255,255,255,0.1)' }} />
            </div>
          )}
        </div>

        <button
          type="submit"
          className="auth-submit"
          disabled={isActionLoading || !formData.name.trim() || !formData.email.trim() || formData.password.length < 6}
        >
          {isActionLoading ? (
            <>
              <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              <span>Registering Researcher...</span>
            </>
          ) : (
            <>
              <span>Create Researcher Account</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

