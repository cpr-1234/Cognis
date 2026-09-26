import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { experimentsApi } from "../../services/api";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import {
  BarChart3, TrendingUp, Zap, Clock, Award,
  Brain, Activity, RefreshCw, FlaskConical, AlertCircle
} from "lucide-react";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [experiments, setExperiments] = useState([]);
  const [selectedParadigm, setSelectedParadigm] = useState("all");
  const [sessions, setSessions] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await experimentsApi.getAll();
      if (res?.success && res.experiments) {
        setExperiments(res.experiments);

        // Fetch results for all experiments
        const allSessions = [];
        for (const exp of res.experiments) {
          try {
            const resultsRes = await experimentsApi.getResults(exp._id);
            if (resultsRes?.success && resultsRes.sessions) {
              resultsRes.sessions.forEach((s) => {
                allSessions.push({
                  ...s,
                  experimentTitle: exp.title,
                  experimentType: exp.experimentType,
                });
              });
            }
          } catch (e) {
            // ignore individual experiment fetch errors
          }
        }
        setSessions(allSessions);
      }
    } catch (err) {
      console.error("Failed to load analytics data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter sessions based on selected paradigm
  const filteredSessions = selectedParadigm === "all"
    ? sessions
    : sessions.filter((s) => s.experimentType === selectedParadigm);

  // Compute live aggregates
  const validRTs = filteredSessions
    .map((s) => s.summary?.meanReactionTimeMs)
    .filter((rt) => rt != null && rt > 0);

  const meanRT = validRTs.length
    ? Math.round(validRTs.reduce((a, b) => a + b, 0) / validRTs.length)
    : 0;

  const validAccuracies = filteredSessions
    .map((s) => s.summary?.accuracy)
    .filter((acc) => acc != null);

  const meanAccuracy = validAccuracies.length
    ? Math.round(validAccuracies.reduce((a, b) => a + b, 0) / validAccuracies.length)
    : 0;

  const congruentRTs = filteredSessions
    .map((s) => s.summary?.congruentMeanRT)
    .filter((rt) => rt != null && rt > 0);

  const meanCongruentRT = congruentRTs.length
    ? Math.round(congruentRTs.reduce((a, b) => a + b, 0) / congruentRTs.length)
    : 0;

  const incongruentRTs = filteredSessions
    .map((s) => s.summary?.incongruentMeanRT)
    .filter((rt) => rt != null && rt > 0);

  const meanIncongruentRT = incongruentRTs.length
    ? Math.round(incongruentRTs.reduce((a, b) => a + b, 0) / incongruentRTs.length)
    : 0;

  const interferenceDelta = meanIncongruentRT && meanCongruentRT
    ? meanIncongruentRT - meanCongruentRT
    : 0;

  const totalTrialsCount = filteredSessions.reduce(
    (sum, s) => sum + (s.trialResponses?.length || s.summary?.totalTrials || 0),
    0
  );

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        <Topbar />

        <main style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <BarChart3 size={22} color="var(--accent)" />
                <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>
                  Cognitive Science Analytics
                </h1>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Real-time aggregated latency modeling, accuracy distribution, and condition metrics from your database.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <select
                value={selectedParadigm}
                onChange={(e) => setSelectedParadigm(e.target.value)}
                style={{
                  background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8,
                  padding: "8px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none"
                }}
              >
                <option value="all">All Paradigms Combined</option>
                <option value="stroop">Stroop Color-Word Interference</option>
                <option value="flanker">Eriksen Flanker Task</option>
                <option value="reaction_time">Simple Reaction Time</option>
                <option value="memory">Working Memory / N-Back</option>
              </select>

              <button
                type="button"
                onClick={fetchData}
                style={{
                  background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8,
                  padding: "8px 12px", color: "var(--text-secondary)", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6, fontSize: 13
                }}
              >
                <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
              </button>
            </div>
          </div>

          {/* Empty state when user has no completed sessions */}
          {filteredSessions.length === 0 ? (
            <div style={{
              background: "var(--bg-card)", border: "1px dashed var(--border)",
              borderRadius: 16, padding: "64px 32px", textAlign: "center", marginTop: 24
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%", background: "var(--accent-light)",
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px"
              }}>
                <BarChart3 size={28} color="var(--accent)" />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                No Session Telemetry Yet
              </h2>
              <p style={{ fontSize: 14, color: "var(--text-muted)", maxWidth: 480, margin: "0 auto 24px", lineHeight: 1.6 }}>
                There are no participant sessions recorded yet for {selectedParadigm === "all" ? "your experiments" : selectedParadigm}.
                Share your experiment links with participants to generate latency distributions and accuracy models.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <Link
                  to="/researcher/dashboard"
                  className="btn btn-primary"
                  style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <FlaskConical size={15} /> View My Experiments
                </Link>
                <Link
                  to="/researcher/experiments/new"
                  className="btn btn-secondary"
                  style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  Create New Experiment
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Key KPI Cards from Real DB Data */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
                      Recorded Sessions
                    </span>
                    <Activity size={16} color="var(--accent)" />
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: "var(--accent)" }}>{filteredSessions.length}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{totalTrialsCount} total trials analyzed</div>
                </div>

                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
                      Mean Response Latency
                    </span>
                    <Clock size={16} color="#3b82f6" />
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)" }}>
                    {meanRT} <span style={{ fontSize: 14, fontWeight: 400, color: "var(--text-muted)" }}>ms</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Hardware-timed via performance.now()</div>
                </div>

                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
                      Overall Accuracy
                    </span>
                    <Award size={16} color="var(--success)" />
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: "var(--success)" }}>{meanAccuracy}%</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Across all evaluated trials</div>
                </div>

                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
                      Interference Delta
                    </span>
                    <TrendingUp size={16} color={interferenceDelta > 0 ? "var(--warning)" : "var(--text-muted)"} />
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: interferenceDelta > 0 ? "var(--warning)" : "var(--text-primary)" }}>
                    {interferenceDelta > 0 ? `+${interferenceDelta} ms` : `${interferenceDelta} ms`}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Incongruent vs Congruent RT</div>
                </div>
              </div>

              {/* Sessions Table */}
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
                    Live Participant Sessions ({filteredSessions.length})
                  </h3>
                  <span className="badge badge-success">Live MongoDB</span>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)", background: "rgba(0,0,0,0.15)" }}>
                      <th style={{ padding: "12px 18px" }}>Anonymous ID</th>
                      <th style={{ padding: "12px 18px" }}>Experiment</th>
                      <th style={{ padding: "12px 18px" }}>Paradigm</th>
                      <th style={{ padding: "12px 18px" }}>Completed At</th>
                      <th style={{ padding: "12px 18px" }}>Trials</th>
                      <th style={{ padding: "12px 18px" }}>Accuracy</th>
                      <th style={{ padding: "12px 18px", textAlign: "right" }}>Mean RT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.map((s, idx) => (
                      <tr key={s._id || idx} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "12px 18px", fontFamily: "monospace", fontWeight: 700, color: "var(--accent)" }}>
                          {s.anonymousParticipantId || "P-UNKNOWN"}
                        </td>
                        <td style={{ padding: "12px 18px", color: "var(--text-primary)", fontWeight: 500 }}>
                          {s.experimentTitle}
                        </td>
                        <td style={{ padding: "12px 18px" }}>
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "var(--bg-hover)", color: "var(--text-muted)", textTransform: "uppercase" }}>
                            {s.experimentType || "standard"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 18px", color: "var(--text-muted)", fontSize: 12 }}>
                          {s.completedAt ? new Date(s.completedAt).toLocaleString() : "Just now"}
                        </td>
                        <td style={{ padding: "12px 18px" }}>
                          {s.trialResponses?.length || s.summary?.totalTrials || 0}
                        </td>
                        <td style={{ padding: "12px 18px" }}>
                          <span style={{ color: (s.summary?.accuracy || 0) >= 80 ? "var(--success)" : "var(--warning)", fontWeight: 600 }}>
                            {s.summary?.accuracy != null ? `${s.summary.accuracy}%` : "—"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 18px", textAlign: "right", fontFamily: "monospace", color: "var(--text-primary)" }}>
                          {s.summary?.meanReactionTimeMs != null ? `${s.summary.meanReactionTimeMs} ms` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
