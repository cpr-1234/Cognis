import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

export const ResearcherDashboard = () => {
  const { researcher, token, logout, updateProfile, isActionLoading, successMsg } = useAuth();
  const [testResponse, setTestResponse] = useState(null);
  const [isTestingRoute, setIsTestingRoute] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [editForm, setEditForm] = useState({
    name: researcher?.name || '',
    institution: researcher?.institution || '',
    fieldOfStudy: researcher?.fieldOfStudy || '',
  });

  // Decode JWT payload for client display
  const decodeJwt = (jwtToken) => {
    if (!jwtToken) return null;
    try {
      const parts = jwtToken.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch {
      return null;
    }
  };

  const decoded = decodeJwt(token);

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  // Test Protected API Route with JWT
  const handleTestProtectedEndpoint = async () => {
    setIsTestingRoute(true);
    setTestResponse(null);
    try {
      const start = performance.now();
      const res = await authApi.getMe();
      const latency = Math.round(performance.now() - start);
      setTestResponse({
        success: true,
        latency: `${latency}ms`,
        data: res,
      });
    } catch (err) {
      setTestResponse({
        success: false,
        error: err.message,
      });
    } finally {
      setIsTestingRoute(false);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    const res = await updateProfile(editForm);
    if (res?.success) {
      setIsEditing(false);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Top Bar */}
      <div className="dash-topbar">
        <div className="dash-user-info">
          <div className="dash-avatar">
            {researcher?.avatar ? (
              <img src={researcher.avatar} alt={researcher.name} />
            ) : (
              <span>{researcher?.name ? researcher.name[0].toUpperCase() : 'R'}</span>
            )}
          </div>
          <div className="dash-meta">
            <h2>
              <span>{researcher?.name || 'Researcher'}</span>
              <span className="role-badge">{researcher?.role || 'Researcher'}</span>
            </h2>
            <div className="dash-email">{researcher?.email}</div>
          </div>
        </div>

        <button type="button" className="btn-logout" onClick={logout}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
          Sign Out
        </button>
      </div>

      {successMsg && (
        <div className="alert-banner alert-success" style={{ marginBottom: '20px' }}>
          {successMsg}
        </div>
      )}

      {/* Stats Grid */}
      <div className="dash-stats-grid">
        <div className="dash-stat-card">
          <div className="stat-title">Authentication Provider</div>
          <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {researcher?.authProvider === 'google' ? (
              <>
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google OAuth 2.0</span>
              </>
            ) : (
              <span>🔑 Password (JWT)</span>
            )}
          </div>
        </div>

        <div className="dash-stat-card">
          <div className="stat-title">Institution</div>
          <div className="stat-value">{researcher?.institution || 'Not specified'}</div>
        </div>

        <div className="dash-stat-card">
          <div className="stat-title">Research Field</div>
          <div className="stat-value">{researcher?.fieldOfStudy || 'Cognitive Sciences'}</div>
        </div>
      </div>

      {/* Interactive JWT Token Inspector Panel */}
      <div className="jwt-panel">
        <div className="jwt-header">
          <h3>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            </svg>
            Active JWT Authorization Session
          </h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="jwt-status-pill">VALID / ACTIVE</span>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              onClick={handleCopyToken}
            >
              {copiedToken ? '✓ Copied' : 'Copy Token'}
            </button>
          </div>
        </div>

        <div className="jwt-raw-box" title="Full cryptographically signed JWT token">
          Bearer {token}
        </div>

        {decoded && (
          <div className="jwt-decoded-grid">
            <div className="jwt-meta-item">
              <div className="jwt-meta-label">Subject ID (MongoDB ObjectId)</div>
              <div className="jwt-meta-val">{decoded.id}</div>
            </div>
            <div className="jwt-meta-item">
              <div className="jwt-meta-label">Token Scope</div>
              <div className="jwt-meta-val">role: {decoded.role}</div>
            </div>
            <div className="jwt-meta-item">
              <div className="jwt-meta-label">Issued At (iat)</div>
              <div className="jwt-meta-val">
                {decoded.iat ? new Date(decoded.iat * 1000).toLocaleString() : 'N/A'}
              </div>
            </div>
            <div className="jwt-meta-item">
              <div className="jwt-meta-label">Expiration (exp)</div>
              <div className="jwt-meta-val" style={{ color: '#38bdf8' }}>
                {decoded.exp ? new Date(decoded.exp * 1000).toLocaleString() : 'N/A'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* End-to-End JWT Route Verification Panel */}
      <div style={{
        background: 'rgba(12, 17, 30, 0.55)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        marginBottom: '24px',
        textAlign: 'left'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h4 style={{ color: '#fff', fontSize: '0.95rem' }}>End-to-End Protected API Test</h4>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
              Send an authenticated <code>GET /api/auth/me</code> request with your JWT Bearer token to verify the server middleware.
            </p>
          </div>
          <button
            type="button"
            className="btn-submit"
            style={{ width: 'auto', padding: '8px 16px', margin: 0, fontSize: '0.85rem' }}
            disabled={isTestingRoute}
            onClick={handleTestProtectedEndpoint}
          >
            {isTestingRoute ? <span className="spinner" /> : '⚡ Test GET /api/auth/me'}
          </button>
        </div>

        {testResponse && (
          <div style={{
            background: '#04060a',
            border: `1px solid ${testResponse.success ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: testResponse.success ? '#6ee7b7' : '#fca5a5'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>HTTP 200 OK • Response Time: {testResponse.latency}</span>
              <span>Authorization: Bearer Verified ✓</span>
            </div>
            <pre style={{ margin: 0, overflowX: 'auto' }}>
              {JSON.stringify(testResponse.data, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Profile Editor Trigger / Form */}
      <div className="dash-actions-row">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setIsEditing(!isEditing)}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
          {isEditing ? 'Close Profile Editor' : 'Edit Institutional Details'}
        </button>
      </div>

      {/* Edit Form Modal/Drawer */}
      {isEditing && (
        <form onSubmit={handleUpdateSubmit} className="auth-form" style={{ marginTop: '20px', textAlign: 'left' }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input no-icon"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Institution</label>
              <input
                type="text"
                className="form-input no-icon"
                value={editForm.institution}
                onChange={(e) => setEditForm({ ...editForm, institution: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Field of Study</label>
            <input
              type="text"
              className="form-input no-icon"
              value={editForm.fieldOfStudy}
              onChange={(e) => setEditForm({ ...editForm, fieldOfStudy: e.target.value })}
            />
          </div>
          <button
            type="submit"
            className="btn-submit"
            style={{ width: 'auto', alignSelf: 'flex-start' }}
            disabled={isActionLoading}
          >
            {isActionLoading ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      )}
    </div>
  );
};
