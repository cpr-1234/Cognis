import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, ShieldCheck } from 'lucide-react';

export function ParticipantLogin() {
  const navigate = useNavigate();
  const [accessCode, setAccessCode] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Allow participant into dashboard
    navigate('/participant/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '440px' }}>
        <div className="auth-logo">
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div className="sidebar-logo-icon">
              <img src="/cognis-logo.png" alt="COGNIS" />
            </div>
            <span className="sidebar-logo-text">COGNIS</span>
          </Link>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <div className="badge badge-info" style={{ gap: 6, padding: '4px 12px', fontSize: 11 }}>
            <ShieldCheck size={13} />
            Participant Portal
          </div>
        </div>
        <div className="auth-title">Participant Sign In</div>
        <div className="auth-sub" style={{ marginBottom: 20 }}>
          Enter study access code or email to continue
        </div>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">Study Access Code</label>
            <input
              className="auth-input"
              type="text"
              placeholder="e.g. STR-42A"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              required
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">Email (Optional)</label>
            <input
              className="auth-input"
              type="email"
              placeholder="participant@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" className="auth-submit">
            Enter Study Session
          </button>
        </form>

        <div className="auth-link-row">
          New participant? <Link to="/participant/register">Register with access code</Link>
        </div>
        <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '12px' }}>
          <Link to="/researcher/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            Are you a researcher? Researcher Portal →
          </Link>
        </div>
        <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '12px' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ParticipantRegister() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [accessCode, setAccessCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/participant/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '440px' }}>
        <div className="auth-logo">
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div className="sidebar-logo-icon">
              <img src="/cognis-logo.png" alt="COGNIS" />
            </div>
            <span className="sidebar-logo-text">COGNIS</span>
          </Link>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <div className="badge badge-info" style={{ gap: 6, padding: '4px 12px', fontSize: 11 }}>
            <ShieldCheck size={13} />
            Participant Portal
          </div>
        </div>
        <div className="auth-title">Participant Registration</div>
        <div className="auth-sub" style={{ marginBottom: 20 }}>
          Join a cognitive study with your invitation code
        </div>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">Study Access Code</label>
            <input
              className="auth-input"
              type="text"
              placeholder="e.g. VWM-88B"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              required
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">Participant Pseudonym / Initials</label>
            <input
              className="auth-input"
              type="text"
              placeholder="e.g. P-102"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-submit">
            Join Study
          </button>
        </form>

        <div className="auth-link-row">
          Already registered? <Link to="/participant/login">Sign in</Link>
        </div>
        <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '12px' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

// Re-export Researcher pages for backwards compatibility
export { default as ResearcherLogin } from './ResearcherLogin';
export { default as ResearcherRegister } from './ResearcherRegister';

