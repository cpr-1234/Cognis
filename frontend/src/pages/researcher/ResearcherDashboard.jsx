import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { studyApi, experimentsApi } from '../../services/api';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import {
  FlaskConical, Users, Zap,
  Plus, PlayCircle, Eye, MoreHorizontal,
  TrendingUp, Clock, Copy, Check, ExternalLink, X, ShieldCheck
} from 'lucide-react';



function StatusBadge({ status }) {
  const map = {
    active: { label: 'Active', class: 'badge-success' },
    paused: { label: 'Paused', class: 'badge-warning' },
    draft: { label: 'Draft', class: 'badge-muted' },
  };
  const s = map[status] || map.active;
  return <span className={`badge ${s.class}`}>{s.label}</span>;
}

function StatCard({ value, label, icon, colorClass }) {
  return (
    <div className={`stat-card ${colorClass} animate-fade-in-up`}>
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        <div className="stat-card-icon-wrap">{icon}</div>
      </div>
      <div className="stat-card-value">{value}</div>
    </div>
  );
}

function ExperimentCard({ exp, onViewReadings }) {
  const [copied, setCopied] = useState(false);

  const copyUrl = () => {
    const fullUrl = `${window.location.origin}/study/${exp.access_code}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      
      <div className="item-card-footer" style={{ flexWrap: 'wrap', gap: 8 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
          <Users size={13} />
          {exp.participant_count} readings
        </span>

        {/* Unique Link Copy Button */}
        <button
          onClick={copyUrl}
          title={`Copy unique link: ${window.location.origin}/study/${exp.access_code}`}
          style={{
            background: 'var(--bg-card)',
            border: `1px solid ${copied ? 'var(--success)' : 'var(--border)'}`,
            borderRadius: 6,
            padding: '3px 10px',
            fontSize: 11,
            color: copied ? 'var(--success)' : '#38bdf8',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            transition: 'all 0.2s',
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Link Copied!' : `/study/${exp.access_code}`}
        </button>

        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <a
            href={`/study/${exp.access_code}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
            title="Open student page in new tab"
          >
            <ExternalLink size={12} /> Test Join
          </a>
          <button
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px 10px', fontSize: 12 }}
            onClick={() => onViewReadings(exp.access_code, exp.title)}
          >
            <Eye size={12} /> Readings
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
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────
export default function ResearcherDashboard() {
  const { user } = useAuth();
  const firstName = user?.name || user?.first_name || 'Researcher';

  const [experiments, setExperiments] = useState([]);
  const [selectedStudyReadings, setSelectedStudyReadings] = useState(null);
  const [readingsLoading, setReadingsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New study form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCode, setNewCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [interactiveExperiments, setInteractiveExperiments] = useState([]);

  // Fetch live studies from backend
  const loadStudies = async () => {
    try {
      const res = await studyApi.getAllStudies();
      if (res?.success && res.studies) {
        const formatted = res.studies.map((s, idx) => ({
          id: s._id || String(idx),
          title: s.title,
          description: s.description,
          status: s.status,
          access_code: s.studyCode,
          participant_count: s.submissionCount || 0,
          updated_at: new Date(s.updatedAt || Date.now()).toLocaleDateString(),
        }));
        setExperiments(formatted);
      } else {
        setExperiments([]);
      }
    } catch (err) {
      console.warn('Error loading studies:', err);
      setExperiments([]);
    }
  };

  const loadInteractiveExperiments = async () => {
    try {
      const res = await experimentsApi.getAll();
      if (res?.success && res.experiments) {
        setInteractiveExperiments(res.experiments);
      }
    } catch (err) {
      console.warn('Error loading interactive experiments:', err);
    }
  };

  useEffect(() => {
    loadStudies();
    loadInteractiveExperiments();
  }, []);

  // View anonymized readings for a study
  const handleViewReadings = async (studyCode, studyTitle) => {
    setReadingsLoading(true);
    setSelectedStudyReadings({ studyCode, title: studyTitle, list: [] });
    try {
      const res = await studyApi.getStudyReadings(studyCode);
      if (res?.success) {
        setSelectedStudyReadings({
          studyCode,
          title: studyTitle,
          total: res.totalReadings,
          list: res.readings || [],
        });
      }
    } catch (err) {
      console.warn('Error loading readings:', err);
    } finally {
      setReadingsLoading(false);
    }
  };

  // Create new study link
  const handleCreateStudy = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      const res = await studyApi.createStudy({
        title: newTitle.trim(),
        description: newDesc.trim(),
        studyCode: newCode.trim() || undefined,
      });
      if (res?.success) {
        setShowCreateModal(false);
        setNewTitle('');
        setNewDesc('');
        setNewCode('');
        await loadStudies();
      }
    } catch (err) {
      alert(err.message || 'Error creating study.');
    } finally {
      setIsCreating(false);
    }
  };

  const totalInteractiveSessions = interactiveExperiments.reduce((sum, e) => sum + (e.sessionCount || 0), 0);
  const totalStudySubmissions = experiments.reduce((sum, e) => sum + (e.participant_count || 0), 0);
  const totalParticipants = totalStudySubmissions + totalInteractiveSessions;
  const activeCount =
    experiments.filter((e) => e.status === 'active').length +
    interactiveExperiments.filter((e) => e.status === 'active').length;
  const totalExperimentsCount = experiments.length + interactiveExperiments.length;

  return (
    <div className="dashboard-layout">
      <Sidebar role="researcher" />

      <div className="main-content">
        <Topbar />

        <div className="page-content">
          {/* Quick Stats Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className="section-title" style={{ marginBottom: 2 }}>Quick Stats</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Real-time metrics for cognitive experiments and student submissions
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link
                to="/researcher/experiments/new"
                className="btn btn-secondary btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  textDecoration: 'none',
                }}
              >
                <FlaskConical size={14} /> Experiment Builder
              </Link>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowCreateModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <PlayCircle size={14} /> New Study Link
              </button>
            </div>
          </div>

          <div className="stat-cards-grid stagger-children">
            <StatCard
              value={totalExperimentsCount}
              label="Total Experiments & Links"
              icon={<FlaskConical size={20} color="#1a7a4a" />}
              colorClass="stat-card-mint"
            />
            <StatCard
              value={activeCount}
              label="Active Studies"
              icon={<Zap size={20} color="#a16300" />}
              colorClass="stat-card-yellow"
            />
            <StatCard
              value={totalParticipants}
              label="Total Sessions Recorded"
              icon={<Users size={20} color="#4a3ab0" />}
              colorClass="stat-card-lavender"
            />
            <StatCard
              value="1 / Student"
              label="Submission Limit"
              icon={<TrendingUp size={20} color="#8a3a20" />}
              colorClass="stat-card-peach"
            />
          </div>

          {/* Two column layout */}
          <div className="two-col">
            {/* Left: Experiments */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div className="section-title" style={{ marginBottom: 0 }}>
                  Active Study Links & Experiments
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link
                    to="/researcher/experiments/new"
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                  >
                    <FlaskConical size={13} /> New Experiment
                  </Link>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
                    <Plus size={14} /> New Study Link
                  </button>
                </div>
              </div>

              {interactiveExperiments.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FlaskConical size={14} /> Visual Trial Builder Experiments ({interactiveExperiments.length})
                  </div>
                  {interactiveExperiments.map((iexp) => (
                    <div key={iexp._id} className="item-card" style={{ borderLeft: '3px solid var(--accent)', marginBottom: 10 }}>
                      <div className="item-card-header">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="item-card-date">
                            {iexp.experimentType?.toUpperCase()} • {iexp.trials?.length || 0} trials
                          </div>
                          <div className="item-card-title">{iexp.title}</div>
                        </div>
                        <span className={`badge ${iexp.status === 'active' ? 'badge-success' : 'badge-muted'}`}>
                          {iexp.status}
                        </span>
                      </div>
                      <p className="item-card-desc">{iexp.description || 'No description provided.'}</p>
                      <div className="item-card-footer" style={{ flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          Sessions: {iexp.sessionCount || 0}
                        </span>
                        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                          <Link
                            to={`/researcher/experiments/${iexp._id}/edit`}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: 11, padding: '4px 10px', textDecoration: 'none' }}
                          >
                            Edit
                          </Link>
                          <Link
                            to={`/researcher/experiments/${iexp._id}/results`}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: 11, padding: '4px 10px', textDecoration: 'none' }}
                          >
                            Results
                          </Link>
                          {iexp.publicId && (
                            <a
                              href={`/experiment/${iexp.publicId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: 11, padding: '4px 8px', textDecoration: 'none' }}
                              title="Open Participant Runner"
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state when user has 0 experiments & studies */}
              {interactiveExperiments.length === 0 && experiments.length === 0 && (
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px dashed var(--border)',
                  borderRadius: 12,
                  padding: '48px 24px',
                  textAlign: 'center',
                  marginBottom: 20
                }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'var(--accent-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    <FlaskConical size={24} color="var(--accent)" />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                    No Experiments or Studies Yet
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 20px', lineHeight: 1.5 }}>
                    Get started by creating an experiment with the visual paradigm builder or launching a study link for students.
                  </p>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <Link
                      to="/researcher/experiments/new"
                      className="btn btn-primary"
                      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Plus size={15} /> Create Experiment
                    </Link>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowCreateModal(true)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <PlayCircle size={15} /> New Study Link
                    </button>
                  </div>
                </div>
              )}

              {experiments.map((exp) => (
                <ExperimentCard
                  key={exp.id}
                  exp={exp}
                  onViewReadings={handleViewReadings}
                />
              ))}
            </div>

            {/* Right: Dynamic Recent Activity & Live Metrics */}
            <div>
              <div className="section-title">Recent Activity</div>
              {interactiveExperiments.length === 0 && experiments.length === 0 ? (
                <div className="item-card" style={{ padding: 20, textAlign: 'center' }}>
                  <Clock size={24} color="var(--text-muted)" style={{ margin: '0 auto 8px', opacity: 0.6 }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                    No Activity Yet
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                    Newly created experiments and participant submissions will appear here.
                  </p>
                </div>
              ) : (
                <>
                  {interactiveExperiments.slice(0, 3).map((iexp) => (
                    <div key={iexp._id} className="item-card" style={{ marginBottom: 10, padding: 14 }}>
                      <div className="item-card-date">
                        {new Date(iexp.updatedAt || iexp.createdAt || Date.now()).toLocaleDateString()}
                      </div>
                      <div className="item-card-title" style={{ fontSize: 13, marginBottom: 4 }}>
                        {iexp.title}
                      </div>
                      <p className="item-card-desc" style={{ fontSize: 12, margin: 0 }}>
                        {iexp.sessionCount || 0} participant session(s) recorded • Status: {iexp.status}
                      </p>
                    </div>
                  ))}
                  {experiments.slice(0, 2).map((exp) => (
                    <div key={exp.id} className="item-card" style={{ marginBottom: 10, padding: 14 }}>
                      <div className="item-card-date">{exp.updated_at}</div>
                      <div className="item-card-title" style={{ fontSize: 13, marginBottom: 4 }}>
                        {exp.title}
                      </div>
                      <p className="item-card-desc" style={{ fontSize: 12, margin: 0 }}>
                        {exp.participant_count || 0} reading(s) submitted • Code: {exp.access_code}
                      </p>
                    </div>
                  ))}
                </>
              )}

              {/* Real Summary Card */}
              {totalParticipants > 0 && (
                <div className="card" style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                      📊 Data Collection Status
                    </div>
                    <span className="badge badge-success">Live DB</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    Total Participant Records: <strong style={{ color: 'var(--accent)' }}>{totalParticipants}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Active studies and experiments are ready to accept anonymous participant data.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* MODAL: Anonymized Readings Inspector */}
          {selectedStudyReadings && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              padding: '16px'
            }}>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '24px',
                maxWidth: '680px',
                width: '100%',
                maxHeight: '85vh',
                overflowY: 'auto',
                boxShadow: 'var(--shadow-card)',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                  <div>
                    <h3 style={{ color: '#fff', fontSize: '1.15rem' }}>
                      Anonymized Student Readings
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                      Study Code: <code>{selectedStudyReadings.studyCode}</code> • {selectedStudyReadings.title}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedStudyReadings(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: 6,
                  padding: '8px 12px',
                  marginBottom: '16px',
                  fontSize: '0.78rem',
                  color: '#a7f3d0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <ShieldCheck size={16} />
                  <span>Student personal email is decoupled for IRB compliance. Only unique Anonymous IDs are stored with readings.</span>
                </div>

                {readingsLoading ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading recorded readings...
                  </div>
                ) : selectedStudyReadings.list?.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No readings submitted yet for this study link.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                          <th style={{ padding: '8px' }}>Anonymous ID</th>
                          <th style={{ padding: '8px' }}>Reaction Time</th>
                          <th style={{ padding: '8px' }}>Accuracy</th>
                          <th style={{ padding: '8px' }}>Score</th>
                          <th style={{ padding: '8px' }}>Submitted At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStudyReadings.list.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontFamily: 'monospace' }}>
                            <td style={{ padding: '10px 8px', color: '#38bdf8', fontWeight: 600 }}>{item.anonymousId}</td>
                            <td style={{ padding: '10px 8px', color: '#4ade80' }}>{item.reading?.reactionTimeMs} ms</td>
                            <td style={{ padding: '10px 8px', color: '#facc15' }}>{item.reading?.accuracy}%</td>
                            <td style={{ padding: '10px 8px', color: '#e2e8f0' }}>{item.reading?.score}</td>
                            <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>
                              {item.submittedAt ? new Date(item.submittedAt).toLocaleTimeString() : 'Recorded'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODAL: Create New Study Link */}
          {showCreateModal && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              padding: '16px'
            }}>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '24px',
                maxWidth: '480px',
                width: '100%',
                boxShadow: 'var(--shadow-card)',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ color: '#fff', fontSize: '1.15rem' }}>
                    Generate Unique Study Link
                  </h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreateStudy} className="auth-form">
                  <div className="form-group">
                    <label className="form-label">Experiment / Study Title</label>
                    <input
                      type="text"
                      className="form-input no-icon"
                      placeholder="e.g. Dual N-Back Working Memory"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Study Description</label>
                    <input
                      type="text"
                      className="form-input no-icon"
                      placeholder="e.g. Assessing fluid intelligence and working memory..."
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Custom Study Code (Optional)</label>
                    <input
                      type="text"
                      className="form-input no-icon"
                      placeholder="e.g. DNB-101 (Leave blank to auto-generate)"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-submit"
                      style={{ width: 'auto', margin: 0, padding: '8px 18px' }}
                      disabled={isCreating || !newTitle.trim()}
                    >
                      {isCreating ? 'Generating...' : 'Generate Study Link'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
