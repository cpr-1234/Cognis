import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import { Brain, Clock, CheckCircle, Award, PlayCircle } from 'lucide-react';

const ASSIGNED = [
  {
    id: '1',
    title: 'Stroop Task — Color-Word Interference',
    researcher: 'Dr. Pranay',
    status: 'pending',
    est_minutes: 12,
    access_code: 'STR-42A',
  },
  {
    id: '2',
    title: 'Visual Working Memory Capacity',
    researcher: 'Dr. Pranay',
    status: 'completed',
    est_minutes: 20,
    access_code: 'VWM-88B',
  },
];

const PARTICIPANT_NAV = [
  { group: 'GENERAL', items: [
    { to: '/participant/dashboard', icon: <Brain size={16} />, label: 'Dashboard' },
  ]},
];

export default function ParticipantDashboard() {
  const { user } = useAuth();
  const firstName = user?.first_name?.split(' ').pop() ?? 'Participant';
  const completed = ASSIGNED.filter(e => e.status === 'completed').length;

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

          {/* Quick Stats */}
          <div className="section-title">Your Progress</div>
          <div className="stat-cards-grid stagger-children">
            <div className="stat-card stat-card-mint animate-fade-in-up">
              <div className="stat-card-icon"><Brain size={20} color="#1a7a4a" /></div>
              <div>
                <div className="stat-card-value">{ASSIGNED.length}</div>
                <div className="stat-card-label">Assigned Studies</div>
              </div>
            </div>
            <div className="stat-card stat-card-lavender animate-fade-in-up">
              <div className="stat-card-icon"><CheckCircle size={20} color="#4a3ab0" /></div>
              <div>
                <div className="stat-card-value">{completed}</div>
                <div className="stat-card-label">Completed</div>
              </div>
            </div>
            <div className="stat-card stat-card-yellow animate-fade-in-up">
              <div className="stat-card-icon"><Clock size={20} color="#a16300" /></div>
              <div>
                <div className="stat-card-value">32m</div>
                <div className="stat-card-label">Total Time Spent</div>
              </div>
            </div>
            <div className="stat-card stat-card-peach animate-fade-in-up">
              <div className="stat-card-icon"><Award size={20} color="#8a3a20" /></div>
              <div>
                <div className="stat-card-value">94%</div>
                <div className="stat-card-label">Avg. Accuracy</div>
              </div>
            </div>
          </div>

          {/* Assigned Experiments */}
          <div>
            <div className="section-title">Assigned Experiments</div>
            {ASSIGNED.map((exp) => (
              <div className="item-card" key={exp.id}>
                <div className="item-card-header">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="item-card-date">By {exp.researcher} · ~{exp.est_minutes} min</div>
                    <div className="item-card-title">{exp.title}</div>
                  </div>
                  <span className={`badge ${exp.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                    {exp.status === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                </div>
                <div className="item-card-footer">
                  <span style={{ fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 600 }}>
                    {exp.access_code}
                  </span>
                  {exp.status !== 'completed' && (
                    <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }}>
                      <PlayCircle size={12} /> Start
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
