import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleAuthButton } from './GoogleAuthButton';

export const RegisterForm = ({ onSwitchToLogin }) => {
  const { register, isActionLoading, error, successMsg } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    institution: '',
    fieldOfStudy: '',
  });

  const [showPassword, setShowPassword] = useState(false);

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
    await register(formData);
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
        <span>or register with institutional profile</span>
      </div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {/* Full Name */}
        <div className="form-group">
          <label className="form-label" htmlFor="reg-name">
            Researcher Full Name & Title
          </label>
          <div className="input-wrapper">
            <span className="input-icon">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <input
              id="reg-name"
              name="name"
              type="text"
              className="form-input"
              placeholder="e.g. Dr. Sarah Connor, Ph.D."
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="form-group">
          <label className="form-label" htmlFor="reg-email">
            Academic / Institutional Email
          </label>
          <div className="input-wrapper">
            <span className="input-icon">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </span>
            <input
              id="reg-email"
              name="email"
              type="email"
              className="form-input"
              placeholder="s.connor@harvard.edu"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Institution & Field in two columns */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="reg-institution">
              Institution / Lab
            </label>
            <input
              id="reg-institution"
              name="institution"
              type="text"
              className="form-input no-icon"
              placeholder="e.g. Max Planck Inst."
              value={formData.institution}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-field">
              Field of Research
            </label>
            <input
              id="reg-field"
              name="fieldOfStudy"
              type="text"
              className="form-input no-icon"
              placeholder="e.g. Cognitive AI"
              value={formData.fieldOfStudy}
              onChange={handleChange}
            />
          </div>
        </div>


        {/* Password */}
        <div className="form-group">
          <label className="form-label" htmlFor="reg-password">
            Secure Access Password
          </label>
          <div className="input-wrapper">
            <span className="input-icon">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              id="reg-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="Min. 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
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

          {/* Password Strength Indicator */}
          {formData.password && (
            <div className="pwd-strength-bar">
              <div className={`strength-segment ${strength >= 1 ? (strength <= 1 ? 'strength-weak' : strength <= 2 ? 'strength-medium' : 'strength-strong') : ''}`} />
              <div className={`strength-segment ${strength >= 2 ? (strength <= 2 ? 'strength-medium' : 'strength-strong') : ''}`} />
              <div className={`strength-segment ${strength >= 3 ? 'strength-strong' : ''}`} />
              <div className={`strength-segment ${strength >= 4 ? 'strength-strong' : ''}`} />
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn-submit"
          disabled={isActionLoading || !formData.name.trim() || !formData.email.trim() || formData.password.length < 6}
        >
          {isActionLoading ? (
            <>
              <span className="spinner" />
              <span>Registering Researcher...</span>
            </>
          ) : (
            <>
              <span>Create Researcher Account</span>
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
