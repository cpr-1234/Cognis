import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { Brain, Clock, CheckCircle, Award, PlayCircle } from 'lucide-react';

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const PARTICIPANT_NAV = [
  { group: 'GENERAL', items: [
    { to: '/participant/dashboard', icon: <Brain size={16} />, label: 'Dashboard' },
  ]},
];

export default function ParticipantDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [accessCode, setAccessCode] = useState('');
  const firstName = user?.first_name || user?.name || 'Participant';

  const handleJoin = (e) => {
    e.preventDefault();
    if (!accessCode.trim()) return;
    const cleanCode = accessCode.trim().toUpperCase();
    navigate(`/study/${cleanCode}`);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar role="participant" />

      <div className="main-content">
        <Topbar />

        <div className="page-content">

          {/* Hero */}
          <div className="hero-banner animate-fade-in">
            <div className="hero-content">
              <h1 className="hero-title">
                Welcome, {firstName}!<br />
                Your Study Sessions
              </h1>
              <p className="hero-subtitle">
                Complete your assigned cognitive experiments and contribute to
                cutting-edge research — all from your browser.
              </p>
            </div>
            <div className="hero-orbs">
              <div className="hero-orb">🧠</div>
              <div className="hero-orb">⏱️</div>
              <div className="hero-orb">🎯</div>
              <div className="hero-orb">📊</div>
              <div className="hero-orb">✅</div>
              <div className="hero-orb">🔬</div>
            </div>
          </div>

          {/* Join a Study Box */}
          <div className="card" style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              Join a Cognitive Study
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Have an invitation code from your researcher or institution? Enter it below to begin your experiment.
            </p>
            <form onSubmit={handleJoin} style={{ display: 'flex', gap: 10, maxWidth: 480 }}>
              <input
                type="text"
                className="auth-input"
                placeholder="Enter Study Code (e.g. COG-A1B2)"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                Join Experiment →
              </button>
            </form>
          </div>

          {/* Info Card */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Brain size={18} color="var(--accent)" />
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                Anonymous Participant Privacy
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
              Your experiment sessions in Cognis are strictly anonymized using cryptographic IDs.
              Researchers evaluate behavioral telemetry, response latencies, and accuracy rates without accessing personal identifiable information.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
