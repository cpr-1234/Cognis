import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { ResearcherDashboard } from './components/ResearcherDashboard';
import './Auth.css';

function AuthMain() {
  const { isAuthenticated, isLoading, clearMessages } = useAuth();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    clearMessages();
  };

  if (isLoading) {
    return (
      <div className="auth-wrapper" style={{ justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="spinner" style={{ width: '36px', height: '36px', borderWidth: '3px', borderTopColor: '#6366f1' }} />
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', letterSpacing: '0.04em' }}>
            Verifying Researcher Session...
          </p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="auth-wrapper">
        <div className="auth-header-brand">
          <div className="brand-badge">
            <span className="brand-badge-dot" />
            <span>Active Institutional Session</span>
          </div>
          <h1 className="brand-title">
            <span className="brand-logo-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2v4" />
                <path d="m4.93 4.93 2.83 2.83" />
                <path d="M2 12h4" />
                <path d="m4.93 19.07 2.83-2.83" />
                <path d="M12 18v4" />
                <path d="m19.07 19.07-2.83-2.83" />
                <path d="M18 12h4" />
                <path d="m19.07 4.93-2.83 2.83" />
              </svg>
            </span>
            COGNIS
          </h1>
          <p className="brand-subtitle">
            Cognitive Science & Neuroscience Research Workspace
          </p>
        </div>

        <ResearcherDashboard />
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      {/* Brand Header */}
      <div className="auth-header-brand">
        <div className="brand-badge">
          <span className="brand-badge-dot" />
          <span>Institutional Research Access</span>
        </div>
        <h1 className="brand-title">
          <span className="brand-logo-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v4" />
              <path d="m4.93 4.93 2.83 2.83" />
              <path d="M2 12h4" />
              <path d="m4.93 19.07 2.83-2.83" />
              <path d="M12 18v4" />
              <path d="m19.07 19.07-2.83-2.83" />
              <path d="M18 12h4" />
              <path d="m19.07 4.93-2.83 2.83" />
            </svg>
          </span>
          COGNIS
        </h1>
        <p className="brand-subtitle">
          Secure portal for academic, clinical, and independent researchers
        </p>
      </div>

      {/* Main Glass Card */}
      <div className="auth-card">
        {/* Toggle Tabs */}
        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'login'}
            className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => handleTabChange('login')}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" x2="3" y1="12" y2="12" />
            </svg>
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'register'}
            className={`auth-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => handleTabChange('register')}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" x2="19" y1="8" y2="14" />
              <line x1="22" x2="16" y1="11" y2="11" />
            </svg>
            Create Account
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'login' ? (
          <LoginForm />
        ) : (
          <RegisterForm onSwitchToLogin={() => handleTabChange('login')} />
        )}
      </div>

      {/* Security & ORCID Footer Notice */}
      <div className="auth-footer">
        <p>
          End-to-End JWT Security • 256-bit Encryption • OAuth 2.0 Identity Protocol
        </p>
        <p style={{ marginTop: '4px' }}>
          Affiliated with recognized academic and clinical research bodies.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <div className="bg-grid-overlay" />
      <AuthProvider>
        <AuthMain />
      </AuthProvider>
    </>
  );
}
