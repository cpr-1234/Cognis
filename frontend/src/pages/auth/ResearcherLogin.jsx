import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, ShieldCheck } from 'lucide-react';
import { LoginForm } from '../../components/LoginForm';

export default function ResearcherLogin() {
  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '440px' }}>
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
            Institutional Research Access
          </div>
        </div>

        {/* Symmetrical Title & Subtitle */}
        <div className="auth-title">Researcher Sign In</div>
        <div className="auth-sub" style={{ marginBottom: 20 }}>
          Enter your academic credentials or sign in with Google
        </div>

        {/* Symmetrical Login Form */}
        <LoginForm />

        {/* Symmetrical Footer Links */}
        <div className="auth-link-row">
          New to Cognis? <Link to="/researcher/register">Create researcher account</Link>
        </div>
        <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '12px' }}>
          <Link to="/study/join" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            Student or participant? Join with study link →
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

