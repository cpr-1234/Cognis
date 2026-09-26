import React, { useState, useEffect } from "react";
import { experimentsApi } from "../../services/api";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import {
  Download, FileSpreadsheet, FileText, CheckCircle2, ShieldCheck,
  Calendar, Database, Layers, ArrowRight, RefreshCw
} from "lucide-react";

export default function DataExportPage() {
  const [experiments, setExperiments] = useState([]);
  const [selectedExp, setSelectedExp] = useState("all");
  const [exportType, setExportType] = useState("raw_trials");
  const [format, setFormat] = useState("csv");
  const [loading, setLoading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    const fetchExps = async () => {
      try {
        const res = await experimentsApi.getAll();
        if (res?.success && res.experiments) {
          setExperiments(res.experiments);
        }
      } catch (e) {
        console.error("Failed to load experiments for export:", e);
      }
    };
    fetchExps();
  }, []);

  const handleExport = async () => {
    setLoading(true);
    setDownloadSuccess(false);

    try {
      let targetExps = experiments;
      if (selectedExp !== "all") {
        targetExps = experiments.filter((e) => e._id === selectedExp);
      }

      const allSessions = [];
      for (const exp of targetExps) {
        try {
          const res = await experimentsApi.getResults(exp._id);
          if (res?.success && res.sessions) {
            res.sessions.forEach((s) => {
              allSessions.push({ ...s, experimentTitle: exp.title, experimentType: exp.experimentType });
            });
          }
        } catch (e) {}
      }

      if (allSessions.length === 0) {
        alert("No participant sessions have been recorded yet for the selected experiment(s). Once participants complete trials, data will be exported.");
        setLoading(false);
        return;
      }

      if (format === "json") {
        let exportData;
        if (exportType === "raw_trials") {
          exportData = allSessions.flatMap((s) =>
            (s.trialResponses || []).map((t, idx) => ({
              anonymousId: s.anonymousParticipantId,
              experimentTitle: s.experimentTitle,
              experimentType: s.experimentType,
              completedAt: s.completedAt,
              trialNumber: idx + 1,
              ...t,
            }))
          );
        } else {
          exportData = allSessions.map((s) => ({
            anonymousId: s.anonymousParticipantId,
            experimentTitle: s.experimentTitle,
            completedAt: s.completedAt,
            accuracy: s.summary?.accuracy,
            meanReactionTimeMs: s.summary?.meanReactionTimeMs,
            medianReactionTimeMs: s.summary?.medianReactionTimeMs,
            score: s.summary?.score,
          }));
        }

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
        triggerDownload(dataStr, `cognis_export_${exportType}_${Date.now()}.json`);
      } else {
        // CSV export
        let headers = [];
        let rows = [];

        if (exportType === "raw_trials") {
          headers = [
            "AnonymousParticipantId",
            "ExperimentTitle",
            "CompletedAt",
            "TrialNumber",
            "StimulusType",
            "StimulusValue",
            "DisplayColor",
            "CorrectResponse",
            "ChosenOption",
            "IsCorrect",
            "ReactionTimeMs",
          ];

          allSessions.forEach((s) => {
            (s.trialResponses || []).forEach((t, idx) => {
              rows.push([
                s.anonymousParticipantId,
                `"${(s.experimentTitle || "").replace(/"/g, '""')}"`,
                s.completedAt ? new Date(s.completedAt).toISOString() : "",
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
        } else {
          headers = [
            "AnonymousParticipantId",
            "ExperimentTitle",
            "CompletedAt",
            "AccuracyPercent",
            "MeanReactionTimeMs",
            "MedianReactionTimeMs",
            "Score",
          ];

          allSessions.forEach((s) => {
            rows.push([
              s.anonymousParticipantId,
              `"${(s.experimentTitle || "").replace(/"/g, '""')}"`,
              s.completedAt ? new Date(s.completedAt).toISOString() : "",
              s.summary?.accuracy ?? "",
              s.summary?.meanReactionTimeMs ?? "",
              s.summary?.medianReactionTimeMs ?? "",
              s.summary?.score ?? "",
            ]);
          });
        }

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        triggerDownload(encodeURI(csvContent), `cognis_export_${exportType}_${Date.now()}.csv`);
      }

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export data.");
    } finally {
      setLoading(false);
    }
  };

  const triggerDownload = (uri, filename) => {
    const link = document.createElement("a");
    link.setAttribute("href", uri);
    link.setAttribute("download", filename);
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
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <Download size={22} color="var(--accent)" />
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>
                Research Data Export
              </h1>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Extract anonymized trial telemetry, latency distributions, and statistical aggregates ready for SPSS, R, Python, and Excel.
            </p>
          </div>

          {/* Privacy Banner */}
          <div style={{
            background: "rgba(124, 106, 247, 0.08)", border: "1px solid rgba(124, 106, 247, 0.25)",
            borderRadius: 8, padding: "12px 16px", marginBottom: 24, display: "flex", alignItems: "center", gap: 10
          }}>
            <ShieldCheck size={18} color="var(--accent)" />
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-primary)" }}>IRB Anonymized Export Guarantee:</strong> Student emails are completely omitted from all CSV and JSON exports. Only generated Anonymous IDs (e.g. <code>P-7A89BF</code>) are included.
            </span>
          </div>

          {downloadSuccess && (
            <div style={{
              background: "rgba(34, 197, 94, 0.12)", border: "1px solid var(--success)",
              borderRadius: 8, padding: "12px 16px", color: "var(--success)",
              marginBottom: 20, display: "flex", alignItems: "center", gap: 8, fontSize: 13
            }}>
              <CheckCircle2 size={16} /> Dataset successfully generated and downloaded!
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24 }}>
            {/* Left: Configuration Form */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 18 }}>
                Export Configuration
              </h3>

              {/* Experiment Picker */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
                  Select Study / Experiment
                </label>
                <select
                  value={selectedExp}
                  onChange={(e) => setSelectedExp(e.target.value)}
                  style={{
                    width: "100%", background: "var(--bg-hover)", border: "1px solid var(--border)",
                    borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none"
                  }}
                >
                  <option value="all">All Experiments & Studies (Combined)</option>
                  {experiments.map((e) => (
                    <option key={e._id} value={e._id}>{e.title}</option>
                  ))}
                </select>
              </div>

              {/* Granularity Picker */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>
                  Dataset Granularity
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div
                    onClick={() => setExportType("raw_trials")}
                    style={{
                      border: exportType === "raw_trials" ? "1px solid var(--accent)" : "1px solid var(--border)",
                      background: exportType === "raw_trials" ? "var(--accent-light)" : "var(--bg-hover)",
                      borderRadius: 8, padding: 14, cursor: "pointer", transition: "all 0.15s"
                    }}
                  >
                    <div style={{ fontWeight: 600, color: exportType === "raw_trials" ? "var(--accent)" : "var(--text-primary)", fontSize: 13, marginBottom: 4 }}>
                      Raw Trial Telemetry
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      Every trial response, millisecond latency, stimulus type, and key press.
                    </div>
                  </div>

                  <div
                    onClick={() => setExportType("session_summary")}
                    style={{
                      border: exportType === "session_summary" ? "1px solid var(--accent)" : "1px solid var(--border)",
                      background: exportType === "session_summary" ? "var(--accent-light)" : "var(--bg-hover)",
                      borderRadius: 8, padding: 14, cursor: "pointer", transition: "all 0.15s"
                    }}
                  >
                    <div style={{ fontWeight: 600, color: exportType === "session_summary" ? "var(--accent)" : "var(--text-primary)", fontSize: 13, marginBottom: 4 }}>
                      Session Summaries
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      One row per participant session with aggregated accuracy & mean RT.
                    </div>
                  </div>
                </div>
              </div>

              {/* Format Picker */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>
                  File Format
                </label>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setFormat("csv")}
                    style={{
                      flex: 1, padding: "10px", borderRadius: 8,
                      border: format === "csv" ? "1px solid var(--accent)" : "1px solid var(--border)",
                      background: format === "csv" ? "var(--accent-light)" : "var(--bg-hover)",
                      color: format === "csv" ? "var(--accent)" : "var(--text-primary)",
                      fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                    }}
                  >
                    <FileSpreadsheet size={16} /> CSV (Excel, R, SPSS)
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat("json")}
                    style={{
                      flex: 1, padding: "10px", borderRadius: 8,
                      border: format === "json" ? "1px solid var(--accent)" : "1px solid var(--border)",
                      background: format === "json" ? "var(--accent-light)" : "var(--bg-hover)",
                      color: format === "json" ? "var(--accent)" : "var(--text-primary)",
                      fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                    }}
                  >
                    <FileText size={16} /> JSON (Python, APIs)
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleExport}
                disabled={loading}
                style={{
                  width: "100%", background: "linear-gradient(135deg, #7c6af7, #5c4de4)",
                  border: "none", borderRadius: 8, padding: "12px", color: "#fff",
                  fontSize: 14, fontWeight: 600, cursor: loading ? "wait" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: "0 4px 14px rgba(124, 106, 247, 0.35)"
                }}
              >
                <Download size={16} /> {loading ? "Generating Dataset..." : `Download ${format.toUpperCase()} Dataset`}
              </button>
            </div>

            {/* Right: Codebook Info */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 14 }}>
                  Codebook Variables & Schema
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12 }}>
                  <div style={{ padding: "8px 12px", background: "var(--bg-hover)", borderRadius: 6 }}>
                    <code style={{ color: "var(--accent)", fontWeight: 600 }}>AnonymousParticipantId</code>
                    <div style={{ color: "var(--text-muted)", marginTop: 2 }}>Non-reversible participant identifier (P-XXXXXXXX)</div>
                  </div>

                  <div style={{ padding: "8px 12px", background: "var(--bg-hover)", borderRadius: 6 }}>
                    <code style={{ color: "var(--accent)", fontWeight: 600 }}>ReactionTimeMs</code>
                    <div style={{ color: "var(--text-muted)", marginTop: 2 }}>Sub-millisecond latency via performance.now()</div>
                  </div>

                  <div style={{ padding: "8px 12px", background: "var(--bg-hover)", borderRadius: 6 }}>
                    <code style={{ color: "var(--accent)", fontWeight: 600 }}>IsCorrect</code>
                    <div style={{ color: "var(--text-muted)", marginTop: 2 }}>Boolean target accuracy flag (TRUE/FALSE)</div>
                  </div>

                  <div style={{ padding: "8px 12px", background: "var(--bg-hover)", borderRadius: 6 }}>
                    <code style={{ color: "var(--accent)", fontWeight: 600 }}>DisplayColor / StimulusValue</code>
                    <div style={{ color: "var(--text-muted)", marginTop: 2 }}>Visual stimulus ink hex color and lexical target</div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--text-muted)" }}>
                Compatible with Python pandas, R tidyverse, JASP, and SPSS data import wizards.
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
