import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { experimentsApi } from "../../services/api";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import {
  Brain, ArrowLeft, Download, RefreshCw, AlertTriangle,
  Award, Clock, Users, Zap, ExternalLink, ChevronDown, ChevronUp,
  BarChart3, ShieldCheck
} from "lucide-react";

export default function ExperimentResults() {
  const { id } = useParams();

  const [experiment, setExperiment] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSession, setExpandedSession] = useState(null);

  // Fetch results
  const fetchResults = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await experimentsApi.getResults(id);
      if (res.success) {
        setExperiment(res.experiment);
        setSessions(res.sessions || []);
      } else {
        setError(res.message || "Failed to load experiment results.");
      }
    } catch (err) {
      setError(err.message || "Failed to load experiment results.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchResults();
  }, [id]);

  // Aggregate stats
  const totalSessions = sessions.length;
  const avgAccuracy = totalSessions
    ? Math.round(sessions.reduce((acc, s) => acc + (s.summary?.accuracy || 0), 0) / totalSessions)
    : 0;
  const avgRT = totalSessions
    ? Math.round(sessions.reduce((acc, s) => acc + (s.summary?.meanReactionTimeMs || 0), 0) / totalSessions)
    : 0;
  const bestRT = totalSessions
    ? Math.min(...sessions.map((s) => s.summary?.meanReactionTimeMs || 99999).filter((v) => v > 0))
    : 0;

  // Export to CSV
  const handleExportCSV = () => {
    if (sessions.length === 0) {
      alert("No completed sessions to export.");
      return;
    }

    const headers = [
      "AnonymousID",
      "CompletedAt",
      "TrialNumber",
      "StimulusType",
      "StimulusValue",
      "DisplayColor",
      "CorrectResponse",
      "ParticipantResponse",
      "IsCorrect",
      "ReactionTimeMs",
    ];

    const rows = [];
    sessions.forEach((s) => {
      const anonId = s.anonymousParticipantId || "P-UNKNOWN";
      const completedAt = s.completedAt ? new Date(s.completedAt).toISOString() : "";

      (s.trialResponses || []).forEach((t, idx) => {
        rows.push([
          anonId,
          completedAt,
          idx + 1,
          `"${(t.stimulusType || "").replace(/"/g, '""')}"`,
          `"${(t.stimulusValue || "").replace(/"/g, '""')}"`,
          `"${(t.displayColor || "").replace(/"/g, '""')}"`,
          `"${(t.correctResponse || "").replace(/"/g, '""')}"`,
          `"${(t.chosenOption || "").replace(/"/g, '""')}"`,
          t.isCorrect ? "TRUE" : "FALSE",
          t.reactionTimeMs != null ? t.reactionTimeMs : "",
        ]);
      });
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `experiment_${experiment?.title?.replace(/[^a-z0-9]/gi, "_").toLowerCase() || id}_results.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        <Topbar />

        <main style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <Link
                  to="/researcher/dashboard"
                  style={{
                    display: "flex", alignItems: "center", gap: 5, color: "var(--text-muted)",
                    fontSize: 13, textDecoration: "none"
                  }}
                >
                  <ArrowLeft size={14} /> Back to Dashboard
                </Link>
                <span style={{ color: "var(--border)" }}>•</span>
                <Link
                  to={`/researcher/experiments/${id}/edit`}
                  style={{ color: "var(--accent)", fontSize: 13, textDecoration: "none", fontWeight: 500 }}
                >
                  Edit Configuration
                </Link>
              </div>

              <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10 }}>
                <BarChart3 size={24} color="var(--accent)" />
                {experiment?.title || "Experiment Results"}
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                Review real-time participant metrics, high-precision latency statistics, and trial breakdowns.
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                onClick={fetchResults}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "8px 14px", color: "var(--text-primary)",
                  fontSize: 13, fontWeight: 500, cursor: "pointer"
                }}
              >
                <RefreshCw size={14} /> Refresh
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                disabled={sessions.length === 0}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "linear-gradient(135deg, #7c6af7, #5c4de4)",
                  border: "none", borderRadius: 8, padding: "8px 16px",
                  color: "#ffffff", fontSize: 13, fontWeight: 600,
                  cursor: sessions.length === 0 ? "not-allowed" : "pointer",
                  opacity: sessions.length === 0 ? 0.6 : 1
                }}
              >
                <Download size={14} /> Export Raw CSV
              </button>
            </div>
          </div>

          {/* Privacy badge */}
          <div style={{
            background: "rgba(124, 106, 247, 0.08)", border: "1px solid rgba(124, 106, 247, 0.25)",
            borderRadius: 8, padding: "10px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10
          }}>
            <ShieldCheck size={18} color="var(--accent)" />
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-primary)" }}>Data Anonymization Enforced:</strong> Participant email addresses are permanently excluded from this view to uphold behavioral research privacy protocols.
            </span>
          </div>

          {/* Error display */}
          {error && (
            <div style={{
              background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--danger)",
              borderRadius: 8, padding: "12px 16px", color: "var(--danger)",
              marginBottom: 16, display: "flex", alignItems: "center", gap: 10, fontSize: 13
            }}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {/* Aggregate KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Participants</span>
                <Users size={18} color="var(--accent)" />
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)" }}>{totalSessions}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Completed sessions</div>
            </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Avg Accuracy</span>
                <Award size={18} color="var(--success)" />
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "var(--success)" }}>{avgAccuracy}%</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Target correct %</div>
            </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Mean RT</span>
                <Clock size={18} color="#3b82f6" />
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)" }}>
                {avgRT} <span style={{ fontSize: 14, fontWeight: 400, color: "var(--text-muted)" }}>ms</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Hardware latency logged</div>
            </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Fastest Avg RT</span>
                <Zap size={18} color="#f59e0b" />
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#f59e0b" }}>
                {bestRT === 99999 ? 0 : bestRT} <span style={{ fontSize: 14, fontWeight: 400, color: "var(--text-muted)" }}>ms</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Top participant speed</div>
            </div>
          </div>

          {/* Completed Sessions Table */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
                Completed Sessions ({sessions.length})
              </h3>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Click row to view trial-by-trial logs
              </span>
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
                Loading session results...
              </div>
            ) : sessions.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <Users size={36} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                <h4 style={{ color: "var(--text-primary)", fontSize: 15, marginBottom: 4 }}>No Participant Submissions Yet</h4>
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                  Share your participant link to start collecting experimental data.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)", background: "rgba(0,0,0,0.15)" }}>
                      <th style={{ padding: "12px 18px" }}>Participant</th>
                      <th style={{ padding: "12px 18px" }}>Completed</th>
                      <th style={{ padding: "12px 18px" }}>Accuracy</th>
                      <th style={{ padding: "12px 18px" }}>Mean RT</th>
                      <th style={{ padding: "12px 18px" }}>Median RT</th>
                      <th style={{ padding: "12px 18px" }}>Score</th>
                      <th style={{ padding: "12px 18px", textAlign: "right" }}>Trials</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => {
                      const isExpanded = expandedSession === s._id;
                      return (
                        <React.Fragment key={s._id}>
                          <tr
                            onClick={() => setExpandedSession(isExpanded ? null : s._id)}
                            style={{
                              borderBottom: "1px solid var(--border)",
                              cursor: "pointer",
                              background: isExpanded ? "var(--bg-hover)" : "transparent",
                              transition: "background 0.15s"
                            }}
                          >
                            <td style={{ padding: "12px 18px" }}>
                              <span style={{
                                fontFamily: "monospace", fontSize: 12, fontWeight: 700,
                                color: "var(--accent)", background: "var(--accent-light)",
                                padding: "2px 8px", borderRadius: 4
                              }}>
                                {s.anonymousParticipantId}
                              </span>
                            </td>
                            <td style={{ padding: "12px 18px", color: "var(--text-secondary)", fontSize: 12 }}>
                              {s.completedAt ? new Date(s.completedAt).toLocaleString() : "—"}
                            </td>
                            <td style={{ padding: "12px 18px" }}>
                              <span style={{
                                fontWeight: 600,
                                color: (s.summary?.accuracy || 0) >= 80 ? "var(--success)" : "var(--warning)"
                              }}>
                                {s.summary?.accuracy ?? 0}%
                              </span>
                            </td>
                            <td style={{ padding: "12px 18px", fontFamily: "monospace" }}>
                              {s.summary?.meanReactionTimeMs ?? 0} ms
                            </td>
                            <td style={{ padding: "12px 18px", fontFamily: "monospace", color: "var(--text-secondary)" }}>
                              {s.summary?.medianReactionTimeMs ?? 0} ms
                            </td>
                            <td style={{ padding: "12px 18px", fontWeight: 600, color: "#f59e0b" }}>
                              {s.summary?.score ?? 0}
                            </td>
                            <td style={{ padding: "12px 18px", textAlign: "right" }}>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--text-muted)" }}>
                                <span>{s.trialResponses?.length || 0}</span>
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Trial Details */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={7} style={{ padding: "16px 24px", background: "rgba(0,0,0,0.25)", borderBottom: "1px solid var(--border)" }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
                                  Trial-by-Trial Log for {s.anonymousParticipantId}:
                                </div>
                                <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-card)" }}>
                                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                                    <thead>
                                      <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)" }}>
                                        <th style={{ padding: "6px 12px" }}>#</th>
                                        <th style={{ padding: "6px 12px" }}>Stimulus</th>
                                        <th style={{ padding: "6px 12px" }}>Target</th>
                                        <th style={{ padding: "6px 12px" }}>Given Response</th>
                                        <th style={{ padding: "6px 12px" }}>Result</th>
                                        <th style={{ padding: "6px 12px", textAlign: "right" }}>Reaction Time</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(s.trialResponses || []).map((t, tIdx) => (
                                        <tr key={tIdx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                                          <td style={{ padding: "6px 12px", color: "var(--text-muted)" }}>{tIdx + 1}</td>
                                          <td style={{ padding: "6px 12px", fontWeight: 600, color: t.displayColor || "inherit" }}>
                                            {t.stimulusValue || `[${t.stimulusType}]`}
                                          </td>
                                          <td style={{ padding: "6px 12px", color: "var(--text-secondary)" }}>{t.correctResponse}</td>
                                          <td style={{ padding: "6px 12px", color: "var(--text-primary)" }}>{t.chosenOption}</td>
                                          <td style={{ padding: "6px 12px" }}>
                                            <span style={{ color: t.isCorrect ? "var(--success)" : "var(--danger)" }}>
                                              {t.isCorrect ? "Correct" : "Incorrect"}
                                            </span>
                                          </td>
                                          <td style={{ padding: "6px 12px", textAlign: "right", fontFamily: "monospace" }}>
                                            {t.reactionTimeMs != null ? `${t.reactionTimeMs} ms` : "Timed Out"}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
