import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Brain, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, Copy, Check, Clock, Zap, Lock } from 'lucide-react';
import { studyApi } from '../../services/api';

export default function StudentStudyPage() {
  const { studyCode: paramCode } = useParams();
  const [searchParams] = useSearchParams();
  const initialCode = paramCode || searchParams.get('code') || searchParams.get('link') || '';

  const [studyCode, setStudyCode] = useState(initialCode);
  const [study, setStudy] = useState(null);
  const [email, setEmail] = useState('');
  const [isLoadingStudy, setIsLoadingStudy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Participant Session State
  const [anonymousId, setAnonymousId] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // Interactive Cognitive Task / Reading State
  const [activeTab, setActiveTab] = useState('task'); // 'task' | 'manual'
  const [taskState, setTaskState] = useState('idle'); // 'idle' | 'waiting' | 'ready' | 'finished'
  const [reactionTime, setReactionTime] = useState(null);
  const [trials, setTrials] = useState([]);
  const [accuracy, setAccuracy] = useState(100);
  const [notes, setNotes] = useState('');
  const [manualRT, setManualRT] = useState('');
  const [manualAccuracy, setManualAccuracy] = useState('95');
  const [manualScore, setManualScore] = useState('800');

  const startTimeRef = useRef(0);
  const timerRef = useRef(null);

  // Colors for Stroop task
  const STROOP_ITEMS = [
    { word: 'RED', color: '#60a5fa', correct: 'BLUE' },
    { word: 'BLUE', color: '#f87171', correct: 'RED' },
    { word: 'GREEN', color: '#facc15', correct: 'YELLOW' },
    { word: 'YELLOW', color: '#4ade80', correct: 'GREEN' },
    { word: 'PURPLE', color: '#f472b6', correct: 'PINK' },
  ];
  const [currentItem, setCurrentItem] = useState(STROOP_ITEMS[0]);

  // Load study details on mount or code change
  useEffect(() => {
    if (studyCode) {
      loadStudy(studyCode);
    }
  }, [studyCode]);

  const loadStudy = async (code) => {
    setIsLoadingStudy(true);
    setError(null);
    try {
      const res = await studyApi.getStudyByCode(code);
      if (res?.success && res.study) {
        setStudy(res.study);
      }
    } catch (err) {
      // If code not found in DB, study will remain null, user can still enter code
    } finally {
      setIsLoadingStudy(false);
    }
  };

  // 1. Student Sign-Up with Unique Link + Email -> Generates Anonymous ID
  const handleStudentSignup = async (e) => {
    e.preventDefault();
    if (!email.trim() || !studyCode.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await studyApi.studentSignup(email.trim(), studyCode.trim());
      if (res?.anonymousId) {
        setAnonymousId(res.anonymousId);
      }
      if (res?.alreadySubmitted) {
        setHasSubmitted(true);
        setSubmittedData({
          submittedAt: res.submittedAt,
          reading: res.reading,
        });
      }
    } catch (err) {
      setError(err.message || 'Error registering for study.');
      if (err.data?.alreadySubmitted) {
        setHasSubmitted(true);
        setAnonymousId(err.data.anonymousId);
        setSubmittedData({
          submittedAt: err.data.submittedAt,
          reading: err.data.reading,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Interactive Reaction Time Trial
  const startTrial = () => {
    setTaskState('waiting');
    const delay = Math.floor(Math.random() * 2000) + 1200; // 1.2s - 3.2s
    const randomIndex = Math.floor(Math.random() * STROOP_ITEMS.length);
    setCurrentItem(STROOP_ITEMS[randomIndex]);

    timerRef.current = setTimeout(() => {
      setTaskState('ready');
      startTimeRef.current = performance.now();
    }, delay);
  };

  const handleTaskResponse = (selectedColor) => {
    if (taskState !== 'ready') return;
    const rt = Math.round(performance.now() - startTimeRef.current);
    const isCorrect = selectedColor === currentItem.correct;

    const newTrials = [...trials, { rt, correct: isCorrect }];
    setTrials(newTrials);
    setReactionTime(rt);

    const correctCount = newTrials.filter((t) => t.correct).length;
    setAccuracy(Math.round((correctCount / newTrials.length) * 100));

    setTaskState('idle');
  };

  // 3. Submit Student Reading (Locked to one reading per email + link)
  const handleSubmitReading = async () => {
    if (!anonymousId || !email || !studyCode) return;

    let readingPayload = {};

    if (activeTab === 'task') {
      const avgRt = trials.length > 0
        ? Math.round(trials.reduce((sum, t) => sum + t.rt, 0) / trials.length)
        : reactionTime || 480;

      readingPayload = {
        reactionTimeMs: avgRt,
        accuracy: accuracy,
        score: Math.max(100, Math.round(1000 - avgRt + (accuracy * 5))),
        trialsCompleted: trials.length || 1,
        notes: notes.trim() || 'Interactive Stroop cognitive reading',
        metrics: { trials },
      };
    } else {
      readingPayload = {
        reactionTimeMs: Number(manualRT) || 450,
        accuracy: Number(manualAccuracy) || 95,
        score: Number(manualScore) || 750,
        trialsCompleted: 10,
        notes: notes.trim() || 'Manual clinical reading entry',
      };
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await studyApi.submitReading({
        email: email.trim(),
        studyCode: studyCode.trim(),
        anonymousId,
        reading: readingPayload,
      });

      if (res?.success) {
        setHasSubmitted(true);
        setSubmittedData({
          submittedAt: res.submittedAt,
          reading: res.reading,
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to submit reading.');
      if (err.data?.alreadySubmitted) {
        setHasSubmitted(true);
        setSubmittedData({
          submittedAt: err.data.submittedAt,
          reading: err.data.reading,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyAnonymousId = () => {
    if (anonymousId) {
      navigator.clipboard.writeText(anonymousId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: anonymousId ? '540px' : '440px', transition: 'max-width 0.25s ease' }}>
        
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
            Participant & Student Portal
          </div>
        </div>

        {/* Symmetrical Title & Subtitle */}
        <div className="auth-title">
          {!anonymousId
            ? 'Student Study Enrollment'
            : hasSubmitted
              ? 'Submission Locked'
              : 'Cognitive Experiment Session'}
        </div>

        <div className="auth-sub" style={{ marginBottom: 20 }}>
          {study?.title ? (
            <span>
              Study: <strong style={{ color: 'var(--text-primary)' }}>{study.title}</strong>
              {' • '}
              <code style={{ color: 'var(--accent)', background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>
                {studyCode}
              </code>
            </span>
          ) : (
            <span>
              Join experiment with study link{' '}
              <code style={{ color: 'var(--accent)', background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>
                {studyCode}
              </code>
            </span>
          )}
        </div>

        {/* Error notification */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.28)',
            color: '#fca5a5',
            fontSize: 13,
            marginBottom: 18,
            textAlign: 'left'
          }} role="alert">
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        {/* STEP 1: Student Sign-Up & Unique Link Acceptance */}
        {!anonymousId ? (
          <div>
            <form onSubmit={handleStudentSignup}>
              <div className="auth-field">
                <label className="auth-label" htmlFor="student-study-code">
                  Unique Study Code
                </label>
                <input
                  id="student-study-code"
                  type="text"
                  className="auth-input"
                  value={studyCode}
                  onChange={(e) => setStudyCode(e.target.value.toUpperCase())}
                  placeholder="e.g. STR-42A"
                  required
                />
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="student-email">
                  Student Institutional / Academic Email
                </label>
                <input
                  id="student-email"
                  type="email"
                  className="auth-input"
                  placeholder="student.name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Anonymity / IRB Guarantee Box - Symmetrical & Subtle */}
              <div style={{
                background: 'var(--bg-hover)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                textAlign: 'left',
                margin: '18px 0'
              }}>
                <ShieldCheck size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Anonymity & Single-Submission Policy:</strong>
                  <p style={{ marginTop: '2px' }}>
                    Your email guarantees single-entry verification. Once registered, your reading is permanently tagged to a random Anonymous ID. Only one reading submission is permitted per student for this study link.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit"
                disabled={isSubmitting || !email.trim() || !studyCode.trim()}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                    <span>Verifying Link & Generating ID...</span>
                  </>
                ) : (
                  <>
                    <span>Accept Study Link & Generate ID</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            <div className="auth-link-row">
              Are you a researcher? <Link to="/researcher/login">Researcher Portal →</Link>
            </div>
            <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '12px' }}>
              <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                ← Back to Home
              </Link>
            </div>
          </div>
        ) : (
          /* STEP 2: Anonymous Student ID Assigned + Reading Submission */
          <div>
            {/* Anonymous ID Assigned Box - Symmetrical & Centered */}
            <div style={{
              background: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '6px'
            }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600 }}>
                Assigned Anonymous Participant ID
              </div>
              <div style={{
                fontSize: '22px',
                fontWeight: 700,
                fontFamily: 'monospace',
                letterSpacing: '0.06em',
                color: 'var(--accent)'
              }}>
                {anonymousId}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '3px 10px', fontSize: '11px' }}
                  onClick={copyAnonymousId}
                >
                  {copiedId ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                  <span>{copiedId ? 'Copied' : 'Copy ID'}</span>
                </button>
                <span className={`badge ${hasSubmitted ? 'badge-warning' : 'badge-success'}`}>
                  {hasSubmitted ? '🔒 Submission Locked' : 'Session Ready'}
                </span>
              </div>
            </div>

            {/* IF ALREADY SUBMITTED: Symmetrical Lockout Banner */}
            {hasSubmitted ? (
              <div style={{
                background: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid rgba(239, 68, 68, 0.22)',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'inline-flex',
                  padding: '12px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.12)',
                  marginBottom: '12px'
                }}>
                  <Lock size={26} color="#f87171" />
                </div>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>
                  Reading Already Submitted & Locked
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '380px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
                  In accordance with cognitive protocol, only <strong>one reading submission</strong> is permitted per student email for study code <code style={{ color: 'var(--accent)' }}>{studyCode}</code>.
                </p>

                {submittedData && (
                  <div style={{
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '14px 16px',
                    maxWidth: '340px',
                    margin: '0 auto',
                    textAlign: 'left',
                    fontFamily: 'monospace',
                    fontSize: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Student ID:</span>
                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{anonymousId}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Reaction Time:</span>
                      <span style={{ color: '#4ade80' }}>{submittedData.reading?.reactionTimeMs} ms</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Accuracy:</span>
                      <span style={{ color: '#facc15' }}>{submittedData.reading?.accuracy}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Submitted:</span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {submittedData.submittedAt ? new Date(submittedData.submittedAt).toLocaleTimeString() : 'Recorded'}
                      </span>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '20px' }}>
                  <Link to="/" className="btn btn-ghost" style={{ fontSize: '13px' }}>
                    Return to Cognis Homepage
                  </Link>
                </div>
              </div>
            ) : (
              /* EXPERIMENT SESSION & READING SUBMISSION INTERFACE */
              <div>
                {/* Symmetrical Sub-tabs: Interactive Task vs Manual Reading Entry */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px',
                  background: 'var(--bg-hover)',
                  padding: '4px',
                  borderRadius: '10px',
                  marginBottom: '18px'
                }}>
                  <button
                    type="button"
                    style={{
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '7px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: activeTab === 'task' ? 'var(--bg-card)' : 'transparent',
                      color: activeTab === 'task' ? 'var(--text-primary)' : 'var(--text-muted)',
                      boxShadow: activeTab === 'task' ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onClick={() => setActiveTab('task')}
                  >
                    <Zap size={14} color={activeTab === 'task' ? 'var(--accent)' : 'inherit'} />
                    Interactive Task
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '7px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: activeTab === 'manual' ? 'var(--bg-card)' : 'transparent',
                      color: activeTab === 'manual' ? 'var(--text-primary)' : 'var(--text-muted)',
                      boxShadow: activeTab === 'manual' ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onClick={() => setActiveTab('manual')}
                  >
                    <Clock size={14} color={activeTab === 'manual' ? 'var(--accent)' : 'inherit'} />
                    Manual Entry
                  </button>
                </div>

                {/* Tab 1: Interactive Cognitive Experiment */}
                {activeTab === 'task' && (
                  <div style={{
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '18px',
                    textAlign: 'center'
                  }}>
                    {taskState === 'idle' && (
                      <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px', lineHeight: 1.5 }}>
                          Identify the <strong style={{ color: 'var(--text-primary)' }}>INK COLOR</strong> of the word shown as fast as you can. Do NOT read the word itself!
                        </p>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ margin: '0 auto', padding: '9px 22px' }}
                          onClick={startTrial}
                        >
                          <Zap size={15} /> Start Trial
                        </button>
                      </div>
                    )}

                    {taskState === 'waiting' && (
                      <div style={{ padding: '16px 0' }}>
                        <div className="spinner" style={{ width: '22px', height: '22px', borderWidth: 2, margin: '0 auto 10px auto' }} />
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Focus on the screen... stimulus appearing shortly</p>
                      </div>
                    )}

                    {taskState === 'ready' && (
                      <div>
                        <div style={{
                          fontSize: '2.4rem',
                          fontWeight: 800,
                          color: currentItem.color,
                          letterSpacing: '0.08em',
                          marginBottom: '16px',
                          textShadow: `0 0 16px ${currentItem.color}66`
                        }}>
                          {currentItem.word}
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                          Select the INK COLOR:
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                          {['BLUE', 'RED', 'YELLOW', 'GREEN', 'PINK'].map((col) => (
                            <button
                              key={col}
                              type="button"
                              className="btn btn-ghost"
                              style={{ padding: '8px 4px', fontWeight: 600, fontSize: '12px', justifyContent: 'center' }}
                              onClick={() => handleTaskResponse(col)}
                            >
                              {col}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Symmetrical Trials Summary Bar */}
                    {trials.length > 0 && (
                      <div style={{
                        marginTop: '18px',
                        paddingTop: '14px',
                        borderTop: '1px solid var(--border)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        textAlign: 'center',
                        fontFamily: 'monospace',
                        fontSize: '13px'
                      }}>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>LAST RT</div>
                          <div style={{ color: 'var(--accent)', fontWeight: 700 }}>{reactionTime} ms</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>TRIALS</div>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{trials.length}</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>ACCURACY</div>
                          <div style={{ color: '#4ade80', fontWeight: 700 }}>{accuracy}%</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Manual Clinical Reading Entry */}
                {activeTab === 'manual' && (
                  <div style={{
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '18px',
                    marginBottom: '18px',
                    textAlign: 'left'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="auth-field" style={{ marginBottom: 0 }}>
                        <label className="auth-label">Reaction Time (ms)</label>
                        <input
                          type="number"
                          className="auth-input"
                          placeholder="e.g. 462"
                          value={manualRT}
                          onChange={(e) => setManualRT(e.target.value)}
                        />
                      </div>
                      <div className="auth-field" style={{ marginBottom: 0 }}>
                        <label className="auth-label">Accuracy (%)</label>
                        <input
                          type="number"
                          className="auth-input"
                          placeholder="e.g. 96"
                          value={manualAccuracy}
                          onChange={(e) => setManualAccuracy(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Optional Notes */}
                <div className="auth-field" style={{ marginBottom: '18px' }}>
                  <label className="auth-label">Participant Session Notes (Optional)</label>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="e.g. Resting state baseline"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {/* Submit Reading Button */}
                <button
                  type="button"
                  className="auth-submit"
                  disabled={isSubmitting || (activeTab === 'task' && trials.length === 0 && !reactionTime && !manualRT)}
                  onClick={handleSubmitReading}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                      <span>Recording & Locking Submission...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Submit Reading (Locks 1-Time Session)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

