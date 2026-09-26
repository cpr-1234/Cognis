import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, ShieldCheck } from 'lucide-react';
import { RegisterForm } from '../../components/RegisterForm';

export default function ResearcherRegister() {
  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        {/* Brand Header */}
        <div className="auth-logo">
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div className="sidebar-logo-icon">
              <img src="/cognis-logo.png" alt="COGNIS" />
            </div>
            <span className="sidebar-logo-text">COGNIS</span>
          </Link>
        </div>

        {/* Eyebrow Pill */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <div className="badge badge-info" style={{ gap: 6, padding: '4px 12px', fontSize: 11 }}>
            <ShieldCheck size={13} />
            Academic & Clinical Onboarding
          </div>
        </div>

        {/* Symmetrical Title & Subtitle */}
        <div className="auth-title">Create Researcher Account</div>
        <div className="auth-sub" style={{ marginBottom: 20 }}>
          Register with institutional affiliation or sign up with Google
        </div>

        {/* Symmetrical Register Form */}
        <RegisterForm />

        {/* Symmetrical Footer Links */}
        <div className="auth-link-row">
          Already registered? <Link to="/researcher/login">Sign in to your account</Link>
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

