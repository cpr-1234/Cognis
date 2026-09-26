import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import {
  FlaskConical, Users, Zap,
  Plus, PlayCircle, Eye, MoreHorizontal,
  TrendingUp, Clock,
} from 'lucide-react';

// ── Demo data ──────────────────────────────────────────────
const DEMO_EXPERIMENTS = [
  {
    id: '1',
    title: 'Stroop Task — Color-Word Interference',
    description: 'Measuring cognitive interference when color and word meaning conflict. Tracking RT and error rates across 120 trials.',
    status: 'active',
    access_code: 'STR-42A',
    participant_count: 34,
    updated_at: '2026-09-25',
  },
  {
    id: '2',
    title: 'Visual Working Memory Capacity',
    description: 'Estimating K (memory capacity) using change detection paradigm with arrays of colored squares.',
    status: 'active',
    access_code: 'VWM-88B',
    participant_count: 21,
    updated_at: '2026-09-24',
  },
  {
    id: '3',
    title: 'Attentional Blink — Dual RSVP',
    description: 'Identifying the temporal window of reduced attention following a target stimulus in rapid serial visual presentation.',
    status: 'paused',
    access_code: 'AB-17C',
    participant_count: 58,
    updated_at: '2026-09-20',
  },
  {
    id: '4',
    title: 'N-Back Working Memory',
    description: 'Adaptive dual n-back training paradigm to measure fluid intelligence and working memory span.',
    status: 'draft',
    access_code: 'NBK-55D',
    participant_count: 0,
    updated_at: '2026-09-18',
  },
];

const RECENT_ACTIVITY = [
  { date: 'Sep 25, 2026', title: 'Stroop Task — Color-Word Interference', desc: 'Participant P-047 completed Session 3. Avg RT: 482ms. Accuracy: 94.3%' },
  { date: 'Sep 25, 2026', title: 'Visual Working Memory Capacity', desc: 'Participant P-031 completed baseline session. K estimate: 3.8 items.' },
  { date: 'Sep 24, 2026', title: 'Attentional Blink — Dual RSVP', desc: 'Session paused pending IRB renewal. 58 participants completed.' },
];

// ── Sub-components ─────────────────────────────────────────
function StatCard({ value, label, icon, colorClass }) {
  return (
    <div className={`stat-card ${colorClass} animate-fade-in-up`}>
      <div className="stat-card-icon">{icon}</div>
      <div>
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-label">{label}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    active:    { cls: 'badge-success', label: 'Active' },
    paused:    { cls: 'badge-warning', label: 'Paused' },
    draft:     { cls: 'badge-muted',   label: 'Draft'  },
    completed: { cls: 'badge-info',    label: 'Done'   },
  };
  const { cls, label } = map[status] || map.draft;
  return <span className={`badge ${cls}`}>{label}</span>;
}

function ExperimentCard({ exp }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(exp.access_code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="item-card">
      <div className="item-card-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="item-card-date">{exp.updated_at}</div>
          <div className="item-card-title">{exp.title}</div>
        </div>
        <StatusBadge status={exp.status} />
      </div>
      <p className="item-card-desc">{exp.description}</p>
      <div className="item-card-footer">
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Users size={12} />
          {exp.participant_count} participants
        </span>
        <button
          onClick={copyCode}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '2px 10px',
            fontSize: 11,
            color: copied ? 'var(--success)' : 'var(--accent)',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontWeight: 600,
            transition: 'all 0.2s',
          }}
        >
          {copied ? '✓ Copied' : exp.access_code}
        </button>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-sm" style={{ padding: '4px 10px', fontSize: 12 }}>
            <Eye size={12} /> View
          </button>
          <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>
            <MoreHorizontal size={14} />
          </button>
        </span>
      </div>
    </div>
  );
}

function ActivityCard({ item }) {
  return (
    <div className="item-card" style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div className="item-card-date">{item.date}</div>
        <div className="item-card-title" style={{ fontSize: 14, marginBottom: 4 }}>{item.title}</div>
        <p className="item-card-desc" style={{ WebkitLineClamp: 2 }}>{item.desc}</p>
      </div>
      <button style={{
        alignSelf: 'flex-start',
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-muted)', padding: 4, flexShrink: 0,
      }}>
        <MoreHorizontal size={16} />
      </button>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────
export default function ResearcherDashboard() {
  const { user } = useAuth();
  const firstName = user?.first_name?.split(' ').pop() ?? 'Researcher';

  const totalParticipants = DEMO_EXPERIMENTS.reduce((sum, e) => sum + e.participant_count, 0);
  const activeCount = DEMO_EXPERIMENTS.filter(e => e.status === 'active').length;

  return (
    <div className="dashboard-layout">
      <Sidebar role="researcher" />

      <div className="main-content">
        <Topbar />

        <div className="page-content">

          {/* Hero Banner */}
          <div className="hero-banner animate-fade-in">
            <div className="hero-content">
              <h1 className="hero-title">
                Welcome back, {firstName} —<br />
                Your Research Command Center
              </h1>
              <p className="hero-subtitle">
                Manage your cognitive experiments, track participant progress,
                and analyze behavioral data — all in one place.
              </p>
              <button className="hero-cta">
                <PlayCircle size={16} />
                Quick Start: New Experiment
              </button>
            </div>
            <div className="hero-orbs">
              <div className="hero-orb">🧠</div>
              <div className="hero-orb">⚗️</div>
              <div className="hero-orb">📊</div>
              <div className="hero-orb">🔬</div>
              <div className="hero-orb">⏱️</div>
              <div className="hero-orb">💡</div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="section-title">Quick Stats</div>
          <div className="stat-cards-grid stagger-children">
            <StatCard
              value={DEMO_EXPERIMENTS.length}
              label="Total Experiments"
              icon={<FlaskConical size={20} color="#1a7a4a" />}
              colorClass="stat-card-mint"
            />
            <StatCard
              value={activeCount}
              label="Active Experiments"
              icon={<Zap size={20} color="#a16300" />}
              colorClass="stat-card-yellow"
            />
            <StatCard
              value={totalParticipants}
              label="Total Participants"
              icon={<Users size={20} color="#4a3ab0" />}
              colorClass="stat-card-lavender"
            />
            <StatCard
              value="94.2%"
              label="Avg. Accuracy Rate"
              icon={<TrendingUp size={20} color="#8a3a20" />}
              colorClass="stat-card-peach"
            />
          </div>

          {/* Two column layout */}
          <div className="two-col">

            {/* Left: Experiments */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div className="section-title" style={{ marginBottom: 0 }}>Quick Launch Experiments</div>
                <button className="btn btn-primary btn-sm">
                  <Plus size={14} /> New
                </button>
              </div>
              {DEMO_EXPERIMENTS.map((exp) => (
                <ExperimentCard key={exp.id} exp={exp} />
              ))}
            </div>

            {/* Right: Recent Activity */}
            <div>
              <div className="section-title">Recent Activity</div>
              {RECENT_ACTIVITY.map((item, i) => (
                <ActivityCard key={i} item={item} />
              ))}

              {/* Reaction Time Summary Card */}
              <div className="card" style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                    📈 Avg. Reaction Times (ms)
                  </div>
                  <span className="badge badge-success">Live</span>
                </div>
                {[
                  { label: 'Stroop Task', rt: 482, max: 700 },
                  { label: 'N-Back (2-back)', rt: 612, max: 900 },
                  { label: 'Visual WM', rt: 394, max: 700 },
                ].map((item) => (
                  <div key={item.label} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                        {item.rt}ms
                      </span>
                    </div>
                    <div style={{
                      height: 6, background: 'var(--bg-hover)', borderRadius: 99, overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${(item.rt / item.max) * 100}%`,
                        background: 'linear-gradient(90deg, var(--accent), #a78bfa)',
                        borderRadius: 99,
                        transition: 'width 1s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
