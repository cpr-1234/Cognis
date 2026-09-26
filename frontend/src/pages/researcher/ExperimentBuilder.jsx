import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { experimentsApi } from "../../services/api";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import {
  Brain, Plus, Trash2, ArrowLeft, Save, Zap,
  Eye, CheckCircle2, AlertTriangle, ChevronUp, ChevronDown,
  FlaskConical, Copy, Check, ExternalLink, BarChart3, Shuffle,
  Layers, MousePointer, Timer, Activity
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────
// Default trial template
// ─────────────────────────────────────────────────────────────────
const createDefaultTrial = (order = 0) => ({
  order,
  stimulusType: "text",
  stimulusValue: "RED",
  displayColor: "#3b82f6",
  correctResponse: "BLUE",
  responseOptions: ["RED", "GREEN", "BLUE", "YELLOW"],
  stimulusDurationMs: 0,
  itiMs: 500,
  meta: {},
});

// ─────────────────────────────────────────────────────────────────
// Stroop Preset (8 trials: 4 congruent, 4 incongruent)
// ─────────────────────────────────────────────────────────────────
const STROOP_PRESET = [
  { order: 0, stimulusType: "text", stimulusValue: "RED", displayColor: "#ef4444", correctResponse: "RED", responseOptions: ["RED", "GREEN", "BLUE", "YELLOW"], stimulusDurationMs: 0, itiMs: 600, meta: { condition: "congruent" } },
  { order: 1, stimulusType: "text", stimulusValue: "GREEN", displayColor: "#22c55e", correctResponse: "GREEN", responseOptions: ["RED", "GREEN", "BLUE", "YELLOW"], stimulusDurationMs: 0, itiMs: 600, meta: { condition: "congruent" } },
  { order: 2, stimulusType: "text", stimulusValue: "BLUE", displayColor: "#3b82f6", correctResponse: "BLUE", responseOptions: ["RED", "GREEN", "BLUE", "YELLOW"], stimulusDurationMs: 0, itiMs: 600, meta: { condition: "congruent" } },
  { order: 3, stimulusType: "text", stimulusValue: "YELLOW", displayColor: "#eab308", correctResponse: "YELLOW", responseOptions: ["RED", "GREEN", "BLUE", "YELLOW"], stimulusDurationMs: 0, itiMs: 600, meta: { condition: "congruent" } },
  { order: 4, stimulusType: "text", stimulusValue: "RED", displayColor: "#3b82f6", correctResponse: "BLUE", responseOptions: ["RED", "GREEN", "BLUE", "YELLOW"], stimulusDurationMs: 0, itiMs: 600, meta: { condition: "incongruent" } },
  { order: 5, stimulusType: "text", stimulusValue: "GREEN", displayColor: "#ef4444", correctResponse: "RED", responseOptions: ["RED", "GREEN", "BLUE", "YELLOW"], stimulusDurationMs: 0, itiMs: 600, meta: { condition: "incongruent" } },
  { order: 6, stimulusType: "text", stimulusValue: "BLUE", displayColor: "#eab308", correctResponse: "YELLOW", responseOptions: ["RED", "GREEN", "BLUE", "YELLOW"], stimulusDurationMs: 0, itiMs: 600, meta: { condition: "incongruent" } },
  { order: 7, stimulusType: "text", stimulusValue: "YELLOW", displayColor: "#22c55e", correctResponse: "GREEN", responseOptions: ["RED", "GREEN", "BLUE", "YELLOW"], stimulusDurationMs: 0, itiMs: 600, meta: { condition: "incongruent" } },
];

// ─────────────────────────────────────────────────────────────────
// Auto-generated paradigm descriptions (no manual trial config needed)
// ─────────────────────────────────────────────────────────────────
const AUTO_GENERATED_TYPES = ["flanker", "reaction_time", "memory"];

const PARADIGM_INFO = {
  stroop: {
    label: "Stroop Effect Task",
    icon: "🎨",
    defaultInstructions: "You will see color words displayed in colored ink. Your task: identify the INK COLOR of the word as quickly and accurately as possible — NOT what the word spells.",
    description: "Cognitive flexibility, selective attention, inhibitory control.",
  },
  flanker: {
    label: "Eriksen Flanker Task",
    icon: "→",
    defaultInstructions: "You will see five arrows in a row. Indicate the direction of the CENTER arrow only — ignore the flanking arrows around it.",
    description: "Response inhibition, attentional filtering, executive function.",
  },
  reaction_time: {
    label: "Simple Reaction Time",
    icon: "⚡",
    defaultInstructions: "Wait for the green circle to appear, then press SPACEBAR as fast as possible. Do NOT press before it appears — that's a false start!",
    description: "Psychomotor speed, stimulus detection, vigilance.",
  },
  memory: {
    label: "Working Memory / N-Back",
    icon: "🧠",
    defaultInstructions: "A sequence of letters will appear. Press MATCH if the current letter matches the one from N positions ago, or NO MATCH otherwise.",
    description: "Working memory capacity, sustained attention, executive control.",
  },
  custom: {
    label: "Custom Paradigm",
    icon: "⚙",
    defaultInstructions: "Respond to each stimulus as quickly and accurately as possible.",
    description: "Fully configurable paradigm with manual trial builder.",
  },
};

// ─────────────────────────────────────────────────────────────────
// Sub-components: TrialCard
// ─────────────────────────────────────────────────────────────────
function TrialCard({ trial, index, total, onChange, onRemove, onMove }) {
  const [expanded, setExpanded] = useState(index === 0);

  const updateField = (field, value) => onChange(index, { ...trial, [field]: value });

  const updateOption = (optIdx, value) => {
    const opts = [...(trial.responseOptions || [])];
    opts[optIdx] = value;
    onChange(index, { ...trial, responseOptions: opts });
  };

  const addOption = () => {
    const opts = [...(trial.responseOptions || []), ""];
    onChange(index, { ...trial, responseOptions: opts });
  };

  const removeOption = (optIdx) => {
    const opts = (trial.responseOptions || []).filter((_, i) => i !== optIdx);
    onChange(index, { ...trial, responseOptions: opts });
  };

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-sm)",
      marginBottom: 12,
      overflow: "hidden",
      transition: "border-color 0.2s",
    }}>
      {/* Trial header */}
      <div
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", cursor: "pointer",
          background: expanded ? "var(--bg-hover)" : "transparent",
          transition: "background 0.15s",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: "var(--accent)",
            background: "var(--accent-light)", padding: "2px 8px", borderRadius: 99,
          }}>
            #{index + 1}
          </span>
          <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>
            {trial.stimulusValue ? `"${trial.stimulusValue.slice(0, 28)}"` : "Untitled Trial"}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            [{trial.stimulusType}]
          </span>
          {trial.displayColor && (
            <span style={{
              display: "inline-block", width: 12, height: 12, borderRadius: "50%",
              backgroundColor: trial.displayColor, border: "1px solid rgba(255,255,255,0.2)"
            }} />
          )}
          {trial.correctResponse && (
            <span style={{ fontSize: 11, color: "var(--success)", background: "rgba(34, 197, 94, 0.1)", padding: "1px 6px", borderRadius: 4 }}>
              ✓ {trial.correctResponse}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <button
            type="button"
            title="Move Up"
            onClick={(e) => { e.stopPropagation(); onMove(index, -1); }}
            disabled={index === 0}
            style={{ background: "none", border: "none", color: index === 0 ? "var(--text-muted)" : "var(--text-secondary)", cursor: index === 0 ? "default" : "pointer", padding: 4 }}
          ><ChevronUp size={16} /></button>
          <button
            type="button"
            title="Move Down"
            onClick={(e) => { e.stopPropagation(); onMove(index, 1); }}
            disabled={index === total - 1}
            style={{ background: "none", border: "none", color: index === total - 1 ? "var(--text-muted)" : "var(--text-secondary)", cursor: index === total - 1 ? "default" : "pointer", padding: 4 }}
          ><ChevronDown size={16} /></button>
          <button
            type="button"
            title="Delete Trial"
            onClick={(e) => { e.stopPropagation(); onRemove(index); }}
            style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4, marginLeft: 4 }}
          ><Trash2 size={15} /></button>
          {expanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
        </div>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 14 }}>
            {/* Stimulus Type */}
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
                Stimulus Type
              </label>
              <select
                value={trial.stimulusType}
                onChange={(e) => updateField("stimulusType", e.target.value)}
                style={{ width: "100%", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 7, padding: "8px 10px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
              >
                <option value="text">Text (word / phrase)</option>
                <option value="color">Color Patch</option>
                <option value="shape">Shape</option>
                <option value="image">Image URL</option>
              </select>
            </div>

            {/* Stimulus Value */}
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
                Stimulus Content / Text
              </label>
              <input
                type="text"
                value={trial.stimulusValue || ""}
                onChange={(e) => updateField("stimulusValue", e.target.value)}
                placeholder='e.g. "RED", "LEFT", or image URL'
                style={{ width: "100%", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 7, padding: "8px 10px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
              />
            </div>

            {/* Display / Ink Color */}
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
                Display / Ink Color
              </label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="color"
                  value={trial.displayColor || "#ffffff"}
                  onChange={(e) => updateField("displayColor", e.target.value)}
                  style={{ width: 38, height: 38, border: "none", background: "none", cursor: "pointer", borderRadius: 4 }}
                />
                <input
                  type="text"
                  value={trial.displayColor || ""}
                  onChange={(e) => updateField("displayColor", e.target.value)}
                  placeholder="#ffffff"
                  style={{ flex: 1, background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 7, padding: "8px 10px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
                />
              </div>
            </div>

            {/* Correct Response */}
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
                Correct Response (Target)
              </label>
              <input
                type="text"
                value={trial.correctResponse || ""}
                onChange={(e) => updateField("correctResponse", e.target.value)}
                placeholder='e.g. "BLUE" or "RED"'
                style={{ width: "100%", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 7, padding: "8px 10px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
              />
            </div>

            {/* Stimulus Duration */}
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
                Duration (ms, 0 = until response)
              </label>
              <input
                type="number"
                value={trial.stimulusDurationMs ?? 0}
                onChange={(e) => updateField("stimulusDurationMs", Number(e.target.value))}
                min={0}
                style={{ width: "100%", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 7, padding: "8px 10px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
              />
            </div>

            {/* Inter-Trial Interval (ITI) */}
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
                Fixation / ITI Interval (ms)
              </label>
              <input
                type="number"
                value={trial.itiMs ?? 500}
                onChange={(e) => updateField("itiMs", Number(e.target.value))}
                min={0}
                style={{ width: "100%", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 7, padding: "8px 10px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
              />
            </div>
          </div>

          {/* Response Options */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Response Options (Participant Buttons)
              </label>
              <button
                type="button"
                onClick={addOption}
                style={{
                  background: "transparent", border: "1px dashed var(--border)", borderRadius: 5,
                  color: "var(--accent)", fontSize: 12, padding: "3px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                }}
              >
                <Plus size={13} /> Add Option
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(trial.responseOptions || []).map((opt, optIdx) => (
                <div key={optIdx} style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--bg-hover)", padding: "4px 8px", borderRadius: 6, border: "1px solid var(--border)" }}>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(optIdx, e.target.value)}
                    placeholder={`Opt ${optIdx + 1}`}
                    style={{ background: "transparent", border: "none", color: "var(--text-primary)", fontSize: 12, width: 80, outline: "none" }}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(optIdx)}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 2 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Live Stimulus Preview Box */}
          <div style={{
            marginTop: 10, padding: 14, background: "rgba(0,0,0,0.25)",
            border: "1px dashed var(--border)", borderRadius: 8, display: "flex",
            alignItems: "center", justifyContent: "space-between"
          }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              <span style={{ fontWeight: 600 }}>Live Stimulus Preview:</span>
            </div>
            <div style={{
              minWidth: 160, height: 60, display: "flex", alignItems: "center",
              justifyContent: "center", background: "#0a0b0e", borderRadius: 6,
              border: "1px solid var(--border)", padding: "0 16px"
            }}>
              {trial.stimulusType === "color" ? (
                <div style={{ width: 44, height: 44, borderRadius: 6, backgroundColor: trial.displayColor || "#ffffff" }} />
              ) : trial.stimulusType === "image" ? (
                trial.stimulusValue ? <img src={trial.stimulusValue} alt="stimulus" style={{ maxHeight: 44, maxWidth: 120, objectFit: "contain" }} /> : <span style={{ color: "var(--text-muted)", fontSize: 11 }}>No URL</span>
              ) : (
                <span style={{
                  color: trial.displayColor || "#ffffff",
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  fontFamily: "Inter, sans-serif"
                }}>
                  {trial.stimulusValue || "(empty)"}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Component: ExperimentBuilder
// ─────────────────────────────────────────────────────────────────
export default function ExperimentBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isEditing = Boolean(id);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [experimentType, setExperimentType] = useState("stroop");
  const [instructions, setInstructions] = useState(PARADIGM_INFO.stroop.defaultInstructions);
  const [trials, setTrials] = useState([createDefaultTrial(0)]);
  const [randomizeTrials, setRandomizeTrials] = useState(true);
  const [allowRetake, setAllowRetake] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState("");
  // Paradigm-specific settings
  const [trialCount, setTrialCount] = useState(20);
  const [nValue, setNValue] = useState(2);
  const [experiment, setExperiment] = useState(null);

  // UI state
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [copied, setCopied] = useState(false);

  // Load existing experiment if editing
  useEffect(() => {
    if (!id) return;
    const fetchExp = async () => {
      try {
        setLoading(true);
        const res = await experimentsApi.getById(id);
        if (res.success && res.experiment) {
          const exp = res.experiment;
          setExperiment(exp);
          setTitle(exp.title || "");
          setDescription(exp.description || "");
          setExperimentType(exp.experimentType || "custom");
          setInstructions(exp.instructions || "");
          setTrials(exp.trials && exp.trials.length > 0 ? exp.trials : [createDefaultTrial(0)]);
          setRandomizeTrials(exp.settings?.randomizeTrials ?? true);
          setAllowRetake(exp.settings?.allowRetake ?? false);
          setMaxParticipants(exp.settings?.maxParticipants || "");
        }
      } catch (err) {
        setError(err.message || "Failed to load experiment.");
      } finally {
        setLoading(false);
      }
    };
    fetchExp();
  }, [id]);

  // Handle paradigm type change
  const handleParadigmChange = (newType) => {
    setExperimentType(newType);
    // Auto-set instructions if they haven't been customized or match another paradigm default
    const currentDefault = Object.values(PARADIGM_INFO).some(p => p.defaultInstructions === instructions);
    if (!instructions || currentDefault) {
      setInstructions(PARADIGM_INFO[newType]?.defaultInstructions || "");
    }
  };

  // Load Preset
  const handleLoadStroopPreset = () => {
    if (window.confirm("Load the Stroop Effect preset (8 trials)? Current trials will be replaced.")) {
      setTitle((t) => t || "Stroop Color-Word Interference Task");
      setDescription((d) => d || "Classic cognitive psychology experiment measuring cognitive flexibility, selective attention, and inhibitory control.");
      setExperimentType("stroop");
      setInstructions(PARADIGM_INFO.stroop.defaultInstructions);
      setTrials(STROOP_PRESET);
      setSuccessMsg("Stroop Effect preset loaded successfully.");
      setTimeout(() => setSuccessMsg(""), 3500);
    }
  };

  // Trial actions
  const handleAddTrial = () => {
    setTrials((prev) => [...prev, createDefaultTrial(prev.length)]);
  };

  const handleUpdateTrial = (index, updated) => {
    setTrials((prev) => {
      const copy = [...prev];
      copy[index] = updated;
      return copy;
    });
  };

  const handleRemoveTrial = (index) => {
    if (trials.length <= 1) {
      alert("An experiment must have at least one trial.");
      return;
    }
    setTrials((prev) => prev.filter((_, i) => i !== index).map((t, idx) => ({ ...t, order: idx })));
  };

  const handleMoveTrial = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= trials.length) return;
    setTrials((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy.map((t, idx) => ({ ...t, order: idx }));
    });
  };

  // Build payload
  const getPayload = () => ({
    title: title.trim(),
    description: description.trim(),
    experimentType,
    instructions: instructions.trim(),
    // For auto-generated paradigms, don't include manual trials
    trials: AUTO_GENERATED_TYPES.includes(experimentType)
      ? []
      : trials.map((t, idx) => ({ ...t, order: idx })),
    settings: {
      randomizeTrials,
      allowRetake,
      maxParticipants: maxParticipants ? Number(maxParticipants) : null,
      // Paradigm-specific
      trialCount: Number(trialCount) || 20,
      nValue: Number(nValue) || 2,
    },
  });

  // Save Draft
  const handleSaveDraft = async () => {
    if (!title.trim()) {
      setError("Please provide an experiment title.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const payload = getPayload();
      let res;
      if (isEditing) {
        res = await experimentsApi.update(id, payload);
      } else {
        res = await experimentsApi.create(payload);
      }

      if (res.success && res.experiment) {
        setExperiment(res.experiment);
        setSuccessMsg("Draft saved successfully!");
        if (!isEditing) {
          navigate(`/researcher/experiments/${res.experiment._id}/edit`, { replace: true });
        }
      }
    } catch (err) {
      setError(err.message || "Failed to save draft.");
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMsg(""), 3500);
    }
  };

  // Publish Experiment
  const handlePublish = async () => {
    if (!title.trim()) {
      setError("Please provide an experiment title.");
      return;
    }
    if (!AUTO_GENERATED_TYPES.includes(experimentType) && trials.length === 0) {
      setError("Add at least one trial before publishing.");
      return;
    }
    setError("");
    setPublishing(true);
    try {
      let expId = id;
      // If new, create first
      if (!isEditing) {
        const createRes = await experimentsApi.create(getPayload());
        expId = createRes.experiment._id;
      } else {
        await experimentsApi.update(expId, getPayload());
      }

      const pubRes = await experimentsApi.publish(expId);
      if (pubRes.success) {
        setExperiment(pubRes.experiment);
        setSuccessMsg("Experiment published successfully! Share the participant link below.");
        if (!isEditing) {
          navigate(`/researcher/experiments/${expId}/edit`, { replace: true });
        }
      }
    } catch (err) {
      setError(err.message || "Failed to publish experiment.");
    } finally {
      setPublishing(false);
    }
  };

  const participantUrl = experiment?.publicId
    ? `${window.location.origin}/experiment/${experiment.publicId}`
    : null;

  const handleCopyLink = () => {
    if (!participantUrl) return;
    navigator.clipboard.writeText(participantUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
          Loading experiment builder...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        <Topbar />

        <main style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
          {/* Header Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <Link
                  to="/researcher/dashboard"
                  style={{
                    display: "flex", alignItems: "center", gap: 5, color: "var(--text-muted)",
                    fontSize: 13, textDecoration: "none", transition: "color 0.2s"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                >
                  <ArrowLeft size={14} /> Back to Dashboard
                </Link>
                <span style={{ color: "var(--border)" }}>•</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                  padding: "2px 8px", borderRadius: 99,
                  background: experiment?.status === "active" ? "rgba(34, 197, 94, 0.15)" : "rgba(124, 106, 247, 0.15)",
                  color: experiment?.status === "active" ? "var(--success)" : "var(--accent)"
                }}>
                  {experiment?.status === "active" ? "Active / Published" : "Draft"}
                </span>
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10 }}>
                <FlaskConical size={24} color="var(--accent)" />
                {isEditing ? "Edit Experiment" : "Create New Experiment"}
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                Configure trials, visual stimuli, display timings, and response keys without writing code.
              </p>
            </div>

            {/* Top Action Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                onClick={handleLoadStroopPreset}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "8px 14px", color: "var(--text-primary)",
                  fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "background 0.2s"
                }}
                title="Populate with standard 8-trial Stroop Effect experiment"
              >
                <Zap size={14} color="#f59e0b" /> Stroop Preset
              </button>

              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "8px 16px", color: "var(--text-primary)",
                  fontSize: 13, fontWeight: 600, cursor: saving ? "wait" : "pointer"
                }}
              >
                <Save size={14} /> {saving ? "Saving..." : "Save Draft"}
              </button>

              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "linear-gradient(135deg, #7c6af7, #5c4de4)",
                  border: "none", borderRadius: 8, padding: "8px 18px",
                  color: "#ffffff", fontSize: 13, fontWeight: 600,
                  cursor: publishing ? "wait" : "pointer", boxShadow: "0 2px 10px rgba(124, 106, 247, 0.3)"
                }}
              >
                <CheckCircle2 size={15} /> {publishing ? "Publishing..." : "Publish & Get Link"}
              </button>
            </div>
          </div>

          {/* Feedback alerts */}
          {error && (
            <div style={{
              background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--danger)",
              borderRadius: 8, padding: "12px 16px", color: "var(--danger)",
              marginBottom: 16, display: "flex", alignItems: "center", gap: 10, fontSize: 13
            }}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {successMsg && (
            <div style={{
              background: "rgba(34, 197, 94, 0.1)", border: "1px solid var(--success)",
              borderRadius: 8, padding: "12px 16px", color: "var(--success)",
              marginBottom: 16, display: "flex", alignItems: "center", gap: 10, fontSize: 13
            }}>
              <CheckCircle2 size={16} /> {successMsg}
            </div>
          )}

          {/* Active Public Participant Link Banner */}
          {experiment?.status === "active" && participantUrl && (
            <div style={{
              background: "linear-gradient(135deg, rgba(124, 106, 247, 0.12), rgba(34, 197, 94, 0.08))",
              border: "1px solid rgba(124, 106, 247, 0.35)", borderRadius: 10,
              padding: "16px 20px", marginBottom: 24, display: "flex",
              alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success)", display: "inline-block" }} />
                  <strong style={{ color: "var(--text-primary)", fontSize: 14 }}>Participant Link Ready</strong>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>• Code: <code style={{ color: "var(--accent)" }}>{experiment.publicId}</code></span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "monospace" }}>
                  {participantUrl}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "var(--bg-card)", border: "1px solid var(--border)",
                    borderRadius: 7, padding: "7px 12px", color: "var(--text-primary)",
                    fontSize: 12, fontWeight: 500, cursor: "pointer"
                  }}
                >
                  {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                  {copied ? "Copied!" : "Copy Link"}
                </button>

                <a
                  href={`/experiment/${experiment.publicId}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "var(--bg-card)", border: "1px solid var(--border)",
                    borderRadius: 7, padding: "7px 12px", color: "var(--text-primary)",
                    fontSize: 12, fontWeight: 500, textDecoration: "none"
                  }}
                >
                  <ExternalLink size={14} /> Open Runner
                </a>

                <Link
                  to={`/researcher/experiments/${experiment._id}/results`}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "var(--accent-light)", border: "1px solid rgba(124, 106, 247, 0.3)",
                    borderRadius: 7, padding: "7px 14px", color: "var(--accent)",
                    fontSize: 12, fontWeight: 600, textDecoration: "none"
                  }}
                >
                  <BarChart3 size={14} /> View Results
                </Link>
              </div>
            </div>
          )}

          {/* Configuration Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 24, marginBottom: 28 }}>
            {/* Left: General Info */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
                Experiment Details
              </h3>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
                  Experiment Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Stroop Color-Word Task"
                  style={{ width: "100%", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 14, outline: "none" }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
                  Short Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Cognitive flexibility and reaction time assessment"
                  style={{ width: "100%", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
                  Experiment Paradigm / Category
                </label>
                <select
                  value={experimentType}
                  onChange={(e) => handleParadigmChange(e.target.value)}
                  style={{ width: "100%", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
                >
                  <option value="stroop">🎨 Stroop Effect Task</option>
                  <option value="flanker">→ Eriksen Flanker Task</option>
                  <option value="reaction_time">⚡ Simple Reaction Time</option>
                  <option value="memory">🧠 Working Memory / N-Back</option>
                  <option value="custom">⚙ Custom Paradigm</option>
                </select>
                {/* Paradigm info badge */}
                {PARADIGM_INFO[experimentType] && (
                  <div style={{
                    marginTop: 8, fontSize: 11, color: "var(--text-muted)",
                    background: "var(--bg-hover)", borderRadius: 6, padding: "6px 10px",
                    borderLeft: "2px solid var(--accent)"
                  }}>
                    {PARADIGM_INFO[experimentType].description}
                    {AUTO_GENERATED_TYPES.includes(experimentType) && (
                      <span style={{ color: "var(--accent)", marginLeft: 4, fontWeight: 600 }}>
                        Trials auto-generated.
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
                  Participant Instructions
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={4}
                  placeholder="Instructions displayed to participants before beginning..."
                  style={{ width: "100%", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", resize: "vertical" }}
                />
              </div>
            </div>

            {/* Right: Settings & Parameters */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
                  Execution Settings
                </h3>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--bg-hover)", borderRadius: 8, marginBottom: 12 }}>
                  <div>
                    <div style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500 }}>Randomize Trial Order</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12 }}>Shuffle trials for each participant to control for sequence bias</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={randomizeTrials}
                    onChange={(e) => setRandomizeTrials(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: "var(--accent)", cursor: "pointer" }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--bg-hover)", borderRadius: 8, marginBottom: 12 }}>
                  <div>
                    <div style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500 }}>Allow Retakes</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12 }}>Allow same participant email to take the experiment multiple times</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowRetake}
                    onChange={(e) => setAllowRetake(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: "var(--accent)", cursor: "pointer" }}
                  />
                </div>

                {/* Paradigm-specific settings */}
                {experimentType === "memory" && (
                  <div style={{ background: "rgba(124,106,247,0.06)", border: "1px solid rgba(124,106,247,0.2)", borderRadius: 8, padding: 14, marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                      <Layers size={13} /> N-Back Parameters
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 4 }}>N Value (back steps)</label>
                        <select
                          value={nValue}
                          onChange={(e) => setNValue(Number(e.target.value))}
                          style={{ width: "100%", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 6, padding: "7px 10px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
                        >
                          <option value={1}>1-Back (easier)</option>
                          <option value={2}>2-Back (moderate)</option>
                          <option value={3}>3-Back (hard)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 4 }}>Total Trials</label>
                        <input
                          type="number" value={trialCount} min={10} max={100}
                          onChange={(e) => setTrialCount(Number(e.target.value))}
                          style={{ width: "100%", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 6, padding: "7px 10px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {(experimentType === "flanker" || experimentType === "reaction_time") && (
                  <div style={{ background: "rgba(124,106,247,0.06)", border: "1px solid rgba(124,106,247,0.2)", borderRadius: 8, padding: 14, marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                      {experimentType === "flanker" ? <Activity size={13} /> : <Timer size={13} />}
                      {experimentType === "flanker" ? "Flanker Parameters" : "RT Parameters"}
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: 4 }}>Total Trials</label>
                      <input
                        type="number" value={trialCount} min={8} max={100}
                        onChange={(e) => setTrialCount(Number(e.target.value))}
                        style={{ width: "100%", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 6, padding: "7px 10px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
                      />
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                        {experimentType === "flanker" ? "Congruent/incongruent trials will be balanced automatically." : "Inter-trial intervals are jittered (1.5–4s) to prevent anticipation."}
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 14 }}>
                  <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
                    Max Participants (Optional)
                  </label>
                  <input
                    type="number"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                    placeholder="Leave empty for unlimited"
                    min={1}
                    style={{ width: "100%", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
                  />
                </div>
              </div>

              {/* Summary stats */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Total Trials</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{trials.length}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Est. Time</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)" }}>
                    ~{Math.max(1, Math.round((trials.length * 1.5) / 60 * 10) / 10)} min
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Timing Precision</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--success)" }}>Sub-ms</div>
                </div>
              </div>
            </div>
          </div>

          {/* Trial Sequence Section */}
          <div style={{ marginBottom: 40 }}>
            {AUTO_GENERATED_TYPES.includes(experimentType) ? (
              // Auto-generated paradigm: show info banner instead of trial builder
              <div style={{
                background: "linear-gradient(135deg, rgba(124,106,247,0.08), rgba(34,197,94,0.06))",
                border: "1px solid rgba(124,106,247,0.25)", borderRadius: 12,
                padding: "32px", textAlign: "center"
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{PARADIGM_INFO[experimentType]?.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                  {PARADIGM_INFO[experimentType]?.label} — Auto-Generated Trials
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 480, margin: "0 auto 16px", lineHeight: 1.6 }}>
                  For this paradigm, trials are generated automatically at runtime based on your settings above.
                  The stimulus sequence is randomized fresh for each participant to control for order effects.
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: 24 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "var(--accent)" }}>{trialCount}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Total Trials</div>
                  </div>
                  {experimentType === "memory" && (
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "var(--accent)" }}>{nValue}-Back</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>N Value</div>
                    </div>
                  )}
                  {experimentType === "flanker" && (
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "var(--success)" }}>50/50</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Congruent / Incongruent</div>
                    </div>
                  )}
                  {experimentType === "reaction_time" && (
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "var(--success)" }}>Jittered</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>1.5–4s ITI (anti-anticipation)</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Manual trial builder (Stroop / Custom)
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                      Trial Sequence ({trials.length})
                    </h3>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      Expand any trial to customize stimulus text, ink color, correct response key, and options.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      type="button" onClick={handleAddTrial}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: "var(--accent-light)", border: "1px solid rgba(124, 106, 247, 0.3)",
                        borderRadius: 8, padding: "8px 16px", color: "var(--accent)",
                        fontSize: 13, fontWeight: 600, cursor: "pointer"
                      }}
                    >
                      <Plus size={15} /> Add Trial
                    </button>
                  </div>
                </div>

                <div>
                  {trials.map((trial, index) => (
                    <TrialCard
                      key={index} trial={trial} index={index} total={trials.length}
                      onChange={handleUpdateTrial} onRemove={handleRemoveTrial} onMove={handleMoveTrial}
                    />
                  ))}
                </div>

                <button
                  type="button" onClick={handleAddTrial}
                  style={{
                    width: "100%", padding: "14px", border: "1px dashed var(--border)",
                    borderRadius: "var(--radius-sm)", background: "transparent",
                    color: "var(--text-muted)", fontSize: 13, fontWeight: 500,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    cursor: "pointer", transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                >
                  <Plus size={16} /> Add Another Trial
                </button>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
