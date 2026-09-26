import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { participantApi } from "../../services/api";
import {
  Brain, CheckCircle2, AlertTriangle, Play,
  Zap, Clock, Award, ShieldCheck, ArrowRight, RefreshCw, BarChart2,
  ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────
// Runner Phases
// ─────────────────────────────────────────────────────────────────
const PHASES = {
  LOADING: "LOADING",
  ERROR: "ERROR",
  ENTRY: "ENTRY",
  ALREADY_COMPLETED: "ALREADY_COMPLETED",
  INSTRUCTIONS: "INSTRUCTIONS",
  NBACK_COUNTDOWN: "NBACK_COUNTDOWN",
  ITI: "ITI",
  STIMULUS: "STIMULUS",
  FEEDBACK: "FEEDBACK",
  SUBMITTING: "SUBMITTING",
  COMPLETED: "COMPLETED",
};

// ─────────────────────────────────────────────────────────────────
// Fisher-Yates Shuffle
// ─────────────────────────────────────────────────────────────────
const shuffle = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// ─────────────────────────────────────────────────────────────────
// Paradigm Helpers
// ─────────────────────────────────────────────────────────────────

/** Generate Flanker trials programmatically */
const generateFlankerTrials = (count = 20) => {
  const configs = [
    { arrows: "→→→→→", direction: "right", congruent: true },
    { arrows: "←←←←←", direction: "left", congruent: true },
    { arrows: "→→←→→", direction: "left", congruent: false },
    { arrows: "←←→←←", direction: "right", congruent: false },
  ];
  const trials = [];
  for (let i = 0; i < count; i++) {
    const cfg = configs[i % configs.length];
    trials.push({
      order: i,
      stimulusType: "flanker",
      stimulusValue: cfg.arrows,
      displayColor: "#ffffff",
      correctResponse: cfg.direction,
      responseOptions: ["left", "right"],
      stimulusDurationMs: 1500,
      itiMs: 500,
      meta: { congruent: cfg.congruent },
    });
  }
  return shuffle(trials).map((t, i) => ({ ...t, order: i }));
};

/** Generate Reaction Time trials */
const generateRTTrials = (count = 20) => {
  const trials = [];
  for (let i = 0; i < count; i++) {
    // Random variable ITI between 1500-4000ms to prevent anticipation
    const jitter = 1500 + Math.floor(Math.random() * 2500);
    trials.push({
      order: i,
      stimulusType: "reaction_time",
      stimulusValue: "GO",
      displayColor: "#22c55e",
      correctResponse: "SPACE",
      responseOptions: ["SPACE"],
      stimulusDurationMs: 1000,
      itiMs: jitter,
      meta: {},
    });
  }
  return trials;
};

/** Generate N-Back trials */
const generateNBackTrials = (n = 2, count = 20) => {
  const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const sequence = [];
  // Build sequence with ~30% match rate
  for (let i = 0; i < count; i++) {
    if (i >= n && Math.random() < 0.3) {
      // Make it a match
      sequence.push(sequence[i - n]);
    } else {
      let letter;
      do {
        letter = letters[Math.floor(Math.random() * letters.length)];
      } while (i >= n && letter === sequence[i - n]);
      sequence.push(letter);
    }
  }

  return sequence.map((letter, i) => {
    const isMatch = i >= n && letter === sequence[i - n];
    return {
      order: i,
      stimulusType: "nback",
      stimulusValue: letter,
      displayColor: "#ffffff",
      correctResponse: isMatch ? "MATCH" : "NO_MATCH",
      responseOptions: ["MATCH", "NO_MATCH"],
      stimulusDurationMs: 500,
      itiMs: 2000,
      meta: { isMatch, nValue: n, position: i },
    };
  });
};

// ─────────────────────────────────────────────────────────────────
// Paradigm instructions
// ─────────────────────────────────────────────────────────────────
const PARADIGM_INSTRUCTIONS = {
  stroop: `You will see color words displayed in colored ink.\n\nYour task: identify the INK COLOR of the word as quickly and accurately as possible — NOT what the word spells.\n\nFor example, if the word "RED" appears in blue ink, the correct answer is BLUE.\n\nClick the button or press the matching number key to respond.`,
  flanker: `You will see five arrows in a row.\n\nYour task: indicate the direction of the CENTER arrow only — ignore the flanking arrows around it.\n\nIf the center arrow points RIGHT (→), press the → key or click RIGHT.\nIf the center arrow points LEFT (←), press the ← key or click LEFT.\n\nRespond as quickly and accurately as possible.`,
  reaction_time: `This is a simple reaction time task.\n\nFix your gaze on the center of the screen and wait for the green circle to appear.\n\nAs soon as you see it, press the SPACEBAR as fast as possible.\n\nDo NOT press before the target appears — this counts as a false start!\n\nYour reaction time will be recorded in milliseconds.`,
  memory: `This is an N-Back working memory task.\n\nYou will see a sequence of letters appear one at a time.\n\nYour task: decide whether the CURRENT letter matches the letter that appeared N positions ago in the sequence.\n\nPress MATCH (or M key) if it matches, NO MATCH (or N key) if it does not.\n\nStay focused — the task requires holding recent letters in memory!`,
  custom: `Respond to each stimulus as quickly and accurately as possible.\n\nClick the correct response button when the stimulus appears.`,
};

// ─────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────
export default function ExperimentRunner() {
  const { publicId } = useParams();

  const [experiment, setExperiment] = useState(null);
  const [trials, setTrials] = useState([]);
  const [phase, setPhase] = useState(PHASES.LOADING);
  const [errorMsg, setErrorMsg] = useState("");

  const [email, setEmail] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [anonymousId, setAnonymousId] = useState("");
  const [joining, setJoining] = useState(false);

  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [responses, setResponses] = useState([]);
  const [lastFeedback, setLastFeedback] = useState(null);
  const [summary, setSummary] = useState(null);

  // N-Back specific: we track the countdown timer value
  const [nbackCountdown, setNbackCountdown] = useState(3);
  // RT: track if response was premature (false start)
  const [isFalseStart, setIsFalseStart] = useState(false);

  const stimulusOnsetRef = useRef(0);
  const timerRef = useRef(null);
  const itiTimerRef = useRef(null);
  const feedbackTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const canRespondRef = useRef(false);
  const rtReadyRef = useRef(false); // for reaction time: true when green circle is showing

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(itiTimerRef.current);
      clearTimeout(feedbackTimerRef.current);
      clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // ── 1. Fetch experiment
  useEffect(() => {
    const fetchExperiment = async () => {
      try {
        setPhase(PHASES.LOADING);
        const res = await participantApi.getExperiment(publicId);
        if (res.success && res.experiment) {
          setExperiment(res.experiment);
          setPhase(PHASES.ENTRY);
        } else {
          setErrorMsg(res.message || "Experiment not found.");
          setPhase(PHASES.ERROR);
        }
      } catch (err) {
        setErrorMsg(err.message || "Failed to load experiment. Check your link.");
        setPhase(PHASES.ERROR);
      }
    };
    if (publicId) fetchExperiment();
  }, [publicId]);

  // ── 2. Start Session
  const handleStartSession = async (e) => {
    e?.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    setErrorMsg("");
    setJoining(true);
    try {
      const res = await participantApi.startSession(publicId, email.trim());
      if (res.success) {
        if (res.experiment) {
          setExperiment((prev) => ({ ...prev, ...res.experiment }));
        }
        setSessionId(res.sessionId);
        setAnonymousId(res.anonymousParticipantId);

        // Build trial list based on paradigm
        const expType = res.experiment?.experimentType || experiment?.experimentType || "custom";
        let trialList = buildTrials(expType, res.experiment || experiment);
        setTrials(trialList);
        setPhase(PHASES.INSTRUCTIONS);
      }
    } catch (err) {
      if (err.status === 409 && err.data?.alreadyCompleted) {
        setAnonymousId(err.data.anonymousParticipantId);
        setSummary(err.data.summary);
        setPhase(PHASES.ALREADY_COMPLETED);
      } else {
        setErrorMsg(err.message || "Could not start session.");
      }
    } finally {
      setJoining(false);
    }
  };

  // ── Build trials based on paradigm
  const buildTrials = (expType, expData) => {
    const settings = expData?.settings || {};
    switch (expType) {
      case "flanker": {
        const count = settings.trialCount || 20;
        return generateFlankerTrials(count);
      }
      case "reaction_time": {
        const count = settings.trialCount || 20;
        return generateRTTrials(count);
      }
      case "memory": {
        const n = settings.nValue || 2;
        const count = settings.trialCount || 20;
        return generateNBackTrials(n, count);
      }
      case "stroop":
      case "custom":
      default: {
        let list = expData?.trials || [];
        if (settings.randomizeTrials) list = shuffle(list);
        return list;
      }
    }
  };

  // ── 3. Begin Experiment
  const handleBeginTrials = () => {
    if (!trials || trials.length === 0) {
      setErrorMsg("This experiment has no configured trials.");
      return;
    }
    setCurrentTrialIndex(0);
    setResponses([]);
    const expType = experiment?.experimentType || "custom";
    if (expType === "memory") {
      startNBackCountdown(0);
    } else {
      startITI(0);
    }
  };

  // ── N-Back: show countdown before first trial
  const startNBackCountdown = (trialIndex) => {
    setPhase(PHASES.NBACK_COUNTDOWN);
    setNbackCountdown(3);
    let count = 3;
    countdownIntervalRef.current = setInterval(() => {
      count--;
      setNbackCountdown(count);
      if (count <= 0) {
        clearInterval(countdownIntervalRef.current);
        startITI(trialIndex);
      }
    }, 1000);
  };

  // ── 4. ITI
  const startITI = useCallback((trialIndex) => {
    setPhase(PHASES.ITI);
    canRespondRef.current = false;
    rtReadyRef.current = false;
    setIsFalseStart(false);

    const trial = trials[trialIndex];
    const itiDuration = trial?.itiMs != null ? trial.itiMs : 500;

    itiTimerRef.current = setTimeout(() => {
      presentStimulus(trialIndex);
    }, itiDuration);
  }, [trials]);

  // ── 5. Present Stimulus
  const presentStimulus = (trialIndex) => {
    const trial = trials[trialIndex];
    if (!trial) return;

    setPhase(PHASES.STIMULUS);
    canRespondRef.current = true;
    stimulusOnsetRef.current = window.performance.now();

    if (trial.stimulusType === "reaction_time") {
      rtReadyRef.current = true;
    }

    if (trial.stimulusDurationMs && trial.stimulusDurationMs > 0) {
      timerRef.current = setTimeout(() => {
        if (canRespondRef.current) {
          // For RT: if no response yet, it's a miss (null RT)
          handleResponse(trial.stimulusType === "reaction_time" ? "MISS" : null, true);
        }
      }, trial.stimulusDurationMs);
    }
  };

  // ── 6. Handle Response
  const handleResponse = useCallback((chosenOption, isTimeout = false) => {
    if (!canRespondRef.current) return;
    canRespondRef.current = false;
    rtReadyRef.current = false;

    if (timerRef.current) clearTimeout(timerRef.current);

    const respondedAt = window.performance.now();
    const onset = stimulusOnsetRef.current;
    const reactionTimeMs = isTimeout ? null : Math.round(respondedAt - onset);

    const trial = trials[currentTrialIndex];

    // Determine correctness per paradigm
    let isCorrect = false;
    let falseStart = false;

    if (trial.stimulusType === "reaction_time") {
      if (chosenOption === "MISS") {
        isCorrect = false;
      } else if (chosenOption === "FALSE_START") {
        isCorrect = false;
        falseStart = true;
      } else {
        isCorrect = true; // Any press on GO is correct
      }
    } else {
      isCorrect = isTimeout
        ? false
        : String(chosenOption).trim().toLowerCase() === String(trial.correctResponse).trim().toLowerCase();
    }

    const responseRecord = {
      trialIndex: currentTrialIndex,
      stimulusType: trial.stimulusType,
      stimulusValue: trial.stimulusValue,
      displayColor: trial.displayColor,
      correctResponse: trial.correctResponse,
      chosenOption: isTimeout ? "TIMEOUT" : chosenOption,
      isCorrect,
      reactionTimeMs: falseStart ? null : reactionTimeMs,
      stimulusOnsetMs: Math.round(onset),
      respondedAtMs: Math.round(respondedAt),
      metadata: {
        ...(trial.meta || {}),
        falseStart,
        congruent: trial.meta?.congruent,
        isMatch: trial.meta?.isMatch,
        nValue: trial.meta?.nValue,
      },
    };

    const newResponses = [...responses, responseRecord];
    setResponses(newResponses);
    setLastFeedback({ isCorrect, rt: reactionTimeMs, isTimeout, falseStart, chosenOption });

    if (falseStart) {
      setIsFalseStart(true);
    }

    setPhase(PHASES.FEEDBACK);
    const feedbackDuration = trial.stimulusType === "reaction_time" ? 600 : 280;
    feedbackTimerRef.current = setTimeout(() => {
      const nextIndex = currentTrialIndex + 1;
      if (nextIndex < trials.length) {
        setCurrentTrialIndex(nextIndex);
        startITI(nextIndex);
      } else {
        finalizeSession(newResponses);
      }
    }, feedbackDuration);
  }, [currentTrialIndex, trials, responses, startITI]);

  // ── 7. Submit
  const finalizeSession = async (finalResponses) => {
    setPhase(PHASES.SUBMITTING);
    try {
      const res = await participantApi.submitResponses(sessionId, finalResponses);
      if (res.success) {
        setSummary(res.summary);
        setPhase(PHASES.COMPLETED);
      } else {
        setErrorMsg(res.message || "Failed to submit responses.");
      }
    } catch (err) {
      setErrorMsg(err.message || "Network error while submitting results.");
    }
  };

  // ── Keyboard handler
  useEffect(() => {
    if (phase !== PHASES.STIMULUS && phase !== PHASES.ITI) return;

    const handleKeyDown = (e) => {
      const trial = trials[currentTrialIndex];
      if (!trial) return;

      const key = e.key;

      // React Time: SPACEBAR
      if (trial.stimulusType === "reaction_time") {
        if (key === " ") {
          e.preventDefault();
          if (phase === PHASES.ITI || !rtReadyRef.current) {
            // False start: pressed during fixation/before GO
            if (canRespondRef.current || phase === PHASES.ITI) {
              if (timerRef.current) clearTimeout(timerRef.current);
              if (itiTimerRef.current) clearTimeout(itiTimerRef.current);
              canRespondRef.current = false;
              rtReadyRef.current = false;
              const newResponses = [...responses, {
                trialIndex: currentTrialIndex,
                stimulusType: "reaction_time",
                stimulusValue: "GO",
                displayColor: "#22c55e",
                correctResponse: "SPACE",
                chosenOption: "FALSE_START",
                isCorrect: false,
                reactionTimeMs: null,
                stimulusOnsetMs: 0,
                respondedAtMs: Math.round(window.performance.now()),
                metadata: { falseStart: true },
              }];
              setResponses(newResponses);
              setLastFeedback({ isCorrect: false, falseStart: true });
              setIsFalseStart(true);
              setPhase(PHASES.FEEDBACK);
              feedbackTimerRef.current = setTimeout(() => {
                const nextIndex = currentTrialIndex + 1;
                if (nextIndex < trials.length) {
                  setCurrentTrialIndex(nextIndex);
                  startITI(nextIndex);
                } else {
                  finalizeSession(newResponses);
                }
              }, 1000);
            }
          } else {
            handleResponse("SPACE");
          }
        }
        return;
      }

      // Flanker: arrow keys
      if (trial.stimulusType === "flanker" && phase === PHASES.STIMULUS) {
        if (key === "ArrowLeft") { e.preventDefault(); handleResponse("left"); return; }
        if (key === "ArrowRight") { e.preventDefault(); handleResponse("right"); return; }
      }

      // N-Back: M / N keys
      if (trial.stimulusType === "nback" && phase === PHASES.STIMULUS) {
        if (key.toLowerCase() === "m") { handleResponse("MATCH"); return; }
        if (key.toLowerCase() === "n") { handleResponse("NO_MATCH"); return; }
      }

      // Stroop / Custom: number keys or option text matching
      if (phase === PHASES.STIMULUS) {
        const upperKey = key.toUpperCase();
        const match = (trial.responseOptions || []).find(
          (opt, idx) => opt.toUpperCase() === upperKey || String(idx + 1) === key
        );
        if (match) handleResponse(match);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, trials, currentTrialIndex, handleResponse, responses, startITI]);

  const expType = experiment?.experimentType || "custom";

  // ─────────────────────────────────────────────────────────────────
  // RENDER: Loading
  // ─────────────────────────────────────────────────────────────────
  if (phase === PHASES.LOADING) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg)", color: "var(--text-secondary)", fontFamily: "Inter, sans-serif"
      }}>
        <div style={{ textAlign: "center" }}>
          <RefreshCw size={28} className="spin" color="var(--accent)" style={{ marginBottom: 12 }} />
          <div>Loading experiment...</div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // RENDER: Error
  // ─────────────────────────────────────────────────────────────────
  if (phase === PHASES.ERROR) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg)", padding: 20, fontFamily: "Inter, sans-serif"
      }}>
        <div style={{
          maxWidth: 440, width: "100%", background: "var(--bg-card)",
          border: "1px solid var(--border)", borderRadius: 12, padding: 32, textAlign: "center"
        }}>
          <AlertTriangle size={40} color="var(--danger)" style={{ marginBottom: 16 }} />
          <h2 style={{ color: "var(--text-primary)", fontSize: 20, marginBottom: 8 }}>Unable to Load Experiment</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>{errorMsg}</p>
          <Link to="/" style={{
            display: "inline-block", background: "var(--bg-hover)", border: "1px solid var(--border)",
            color: "var(--text-primary)", padding: "10px 20px", borderRadius: 8, fontSize: 13, textDecoration: "none"
          }}>Return to Home</Link>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // RENDER: Entry
  // ─────────────────────────────────────────────────────────────────
  if (phase === PHASES.ENTRY) {
    const typeLabel = {
      stroop: "Stroop Effect", flanker: "Flanker Task",
      reaction_time: "Reaction Time", memory: "N-Back Memory", custom: "Custom Paradigm"
    }[expType] || expType?.toUpperCase() || "EXPERIMENT";

    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "radial-gradient(ellipse at 50% 30%, #1c1d2e 0%, #111218 70%)",
        padding: 24, fontFamily: "Inter, sans-serif"
      }}>
        <div style={{
          maxWidth: 480, width: "100%", background: "var(--bg-card)",
          border: "1px solid var(--border)", borderRadius: 16, padding: "36px 32px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8, background: "#0a0d14",
              border: "1px solid rgba(34, 211, 238, 0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 12px rgba(34, 211, 238, 0.25)", overflow: "hidden"
            }}>
              <img src="/cognis-logo.png" alt="COGNIS" style={{ width: 32, height: 32, objectFit: "cover", mixBlendMode: "screen" }} />
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, color: "#ffffff", letterSpacing: "0.12em" }}>COGNIS</span>
          </div>

          <span style={{
            display: "inline-block", fontSize: 11, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.06em", color: "var(--accent)", background: "var(--accent-light)",
            padding: "3px 10px", borderRadius: 99, marginBottom: 12
          }}>{typeLabel}</span>

          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, lineHeight: 1.3 }}>
            {experiment?.title}
          </h1>

          {experiment?.description && (
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.5 }}>
              {experiment.description}
            </p>
          )}

          <div style={{
            background: "rgba(124, 106, 247, 0.08)", border: "1px solid rgba(124, 106, 247, 0.2)",
            borderRadius: 10, padding: "12px 14px", marginBottom: 24, display: "flex", gap: 10, alignItems: "flex-start"
          }}>
            <ShieldCheck size={18} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>
              <strong style={{ color: "var(--text-primary)" }}>Anonymity Protected:</strong> Your email is only used to verify single submission. The researcher sees only a generated anonymous ID (e.g. <code>P-7F89B2</code>).
            </div>
          </div>

          {errorMsg && (
            <div style={{
              background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--danger)",
              borderRadius: 8, padding: "10px 14px", color: "var(--danger)",
              marginBottom: 16, fontSize: 12, display: "flex", alignItems: "center", gap: 8
            }}>
              <AlertTriangle size={15} /> {errorMsg}
            </div>
          )}

          <form onSubmit={handleStartSession}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
                Participant Email Address
              </label>
              <input
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@university.edu"
                style={{
                  width: "100%", background: "var(--bg-hover)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "12px 14px", color: "var(--text-primary)", fontSize: 14, outline: "none"
                }}
              />
            </div>

            <button
              type="submit" disabled={joining}
              style={{
                width: "100%", background: "linear-gradient(135deg, #7c6af7, #5c4de4)",
                border: "none", borderRadius: 8, padding: "12px", color: "#fff",
                fontSize: 14, fontWeight: 600, cursor: joining ? "wait" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 4px 14px rgba(124, 106, 247, 0.35)"
              }}
            >
              {joining ? "Generating Anonymous ID..." : "Enter Experiment"}
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // RENDER: Already Completed
  // ─────────────────────────────────────────────────────────────────
  if (phase === PHASES.ALREADY_COMPLETED) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg)", padding: 24, fontFamily: "Inter, sans-serif"
      }}>
        <div style={{
          maxWidth: 480, width: "100%", background: "var(--bg-card)",
          border: "1px solid var(--border)", borderRadius: 16, padding: "36px 32px", textAlign: "center"
        }}>
          <CheckCircle2 size={48} color="var(--success)" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
            Submission Already Recorded
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
            You have already completed this experiment. Multiple submissions are not permitted for this study.
          </p>

          <div style={{ background: "var(--bg-hover)", borderRadius: 10, padding: 16, marginBottom: 24, textAlign: "left" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Anonymous Participant ID</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent)", fontFamily: "monospace" }}>{anonymousId}</div>
            {summary && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Accuracy</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{summary.accuracy}%</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Mean RT</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{summary.meanReactionTimeMs} ms</div>
                </div>
              </div>
            )}
          </div>

          <Link to="/" style={{
            display: "inline-block", background: "var(--bg-hover)", border: "1px solid var(--border)",
            color: "var(--text-primary)", padding: "10px 20px", borderRadius: 8, fontSize: 13, textDecoration: "none"
          }}>Close / Home</Link>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // RENDER: Instructions
  // ─────────────────────────────────────────────────────────────────
  if (phase === PHASES.INSTRUCTIONS) {
    const instructionText = experiment?.instructions
      || PARADIGM_INSTRUCTIONS[expType]
      || PARADIGM_INSTRUCTIONS.custom;

    const paradigmHints = {
      flanker: [
        { icon: "←→", label: "Arrow Keys", desc: "Use ← → arrow keys to respond" },
        { icon: "👁", label: "Center Only", desc: "Focus on the MIDDLE arrow only" },
      ],
      reaction_time: [
        { icon: "⎵", label: "Spacebar", desc: "Press SPACE when the green circle appears" },
        { icon: "⚡", label: "No False Starts", desc: "Don't press before the target!" },
      ],
      memory: [
        { icon: "M", label: "M Key = Match", desc: "Press M if it matches N positions back" },
        { icon: "N", label: "N Key = No Match", desc: "Press N if it does NOT match" },
      ],
      stroop: [
        { icon: "🎨", label: "Ink Color", desc: "Report the INK color, not the word" },
        { icon: "1–4", label: "Number Keys", desc: "Use 1–4 keys or click buttons" },
      ],
      custom: [
        { icon: "⌨", label: "Keyboard or Click", desc: "Use number keys or click buttons" },
        { icon: "⏱", label: "High Precision", desc: "Sub-ms timing via hardware clock" },
      ],
    };

    const hints = paradigmHints[expType] || paradigmHints.custom;

    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg)", padding: 24, fontFamily: "Inter, sans-serif"
      }}>
        <div style={{
          maxWidth: 600, width: "100%", background: "var(--bg-card)",
          border: "1px solid var(--border)", borderRadius: 16, padding: "36px 32px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>
              ID: <strong style={{ color: "var(--accent)" }}>{anonymousId}</strong>
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {trials.length} Trials
            </span>
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
            Instructions
          </h2>

          <div style={{
            background: "var(--bg-hover)", borderRadius: 10, padding: 18,
            fontSize: 14, color: "var(--text-primary)", lineHeight: 1.7,
            marginBottom: 20, whiteSpace: "pre-wrap"
          }}>
            {instructionText}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
            {hints.map((hint, i) => (
              <div key={i} style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)", borderRadius: 8, padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontFamily: "monospace", fontWeight: 800, fontSize: 14,
                    color: "var(--accent)", background: "var(--accent-light)",
                    padding: "2px 8px", borderRadius: 6
                  }}>{hint.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{hint.label}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{hint.desc}</div>
              </div>
            ))}
          </div>

          <button
            type="button" onClick={handleBeginTrials}
            style={{
              width: "100%", background: "linear-gradient(135deg, #7c6af7, #5c4de4)",
              border: "none", borderRadius: 10, padding: "14px", color: "#fff",
              fontSize: 15, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 16px rgba(124, 106, 247, 0.4)"
            }}
          >
            <Play size={18} fill="#fff" /> Begin Experiment
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // RENDER: N-Back Countdown
  // ─────────────────────────────────────────────────────────────────
  if (phase === PHASES.NBACK_COUNTDOWN) {
    return (
      <div style={{
        height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#08090c", fontFamily: "Inter, sans-serif"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 16, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Starting in
          </div>
          <div style={{
            fontSize: 96, fontWeight: 900, color: "var(--accent)",
            textShadow: "0 0 40px rgba(124,106,247,0.6)",
            lineHeight: 1
          }}>{nbackCountdown}</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", marginTop: 16 }}>Get ready...</div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // RENDER: Active Experiment (ITI / Stimulus / Feedback)
  // ─────────────────────────────────────────────────────────────────
  if (phase === PHASES.ITI || phase === PHASES.STIMULUS || phase === PHASES.FEEDBACK) {
    const trial = trials[currentTrialIndex];
    const progress = Math.round((currentTrialIndex / trials.length) * 100);
    const currentExpType = trial?.stimulusType || expType;

    return (
      <div style={{
        height: "100vh", display: "flex", flexDirection: "column",
        background: "#08090c", userSelect: "none", fontFamily: "Inter, sans-serif"
      }}>
        {/* Top progress bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)"
        }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
            {anonymousId}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 160, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: "100%", background: "var(--accent)", transition: "width 0.3s" }} />
            </div>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
              {currentTrialIndex + 1} / {trials.length}
            </span>
          </div>
        </div>

        {/* Central display */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>

          {/* ── Fixation ITI */}
          {phase === PHASES.ITI && (
            <div style={{
              fontSize: 52, fontWeight: 300,
              color: isFalseStart ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.25)",
              fontFamily: "monospace"
            }}>
              {isFalseStart ? "!" : "+"}
            </div>
          )}

          {/* ── Stimulus Phase */}
          {phase === PHASES.STIMULUS && trial && (() => {
            switch (currentExpType) {
              case "reaction_time":
                return (
                  <div style={{ textAlign: "center" }}>
                    <div style={{
                      width: 160, height: 160, borderRadius: "50%",
                      background: "radial-gradient(circle, #22c55e, #16a34a)",
                      boxShadow: "0 0 60px rgba(34,197,94,0.5), 0 0 120px rgba(34,197,94,0.2)",
                      margin: "0 auto 24px",
                      animation: "pulse 0.6s ease-in-out"
                    }} />
                    <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em" }}>
                      PRESS SPACEBAR
                    </div>
                  </div>
                );

              case "flanker":
                return (
                  <div style={{ textAlign: "center" }}>
                    <div style={{
                      fontSize: 72, letterSpacing: "0.15em", color: "#ffffff",
                      fontWeight: 300, fontFamily: "monospace",
                      textShadow: "0 0 20px rgba(255,255,255,0.2)"
                    }}>
                      {trial.stimulusValue}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 20, letterSpacing: "0.06em" }}>
                      ← Left Arrow &nbsp;&nbsp; Right Arrow →
                    </div>
                  </div>
                );

              case "nback":
                return (
                  <div style={{ textAlign: "center" }}>
                    <div style={{
                      fontSize: 120, fontWeight: 900, color: "#ffffff",
                      fontFamily: "Inter, sans-serif", letterSpacing: "-0.02em",
                      textShadow: "0 0 40px rgba(255,255,255,0.15)",
                      lineHeight: 1
                    }}>
                      {trial.stimulusValue}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginTop: 24, letterSpacing: "0.06em" }}>
                      M = Match &nbsp;&nbsp; N = No Match
                    </div>
                  </div>
                );

              case "color":
                return (
                  <div style={{
                    width: 160, height: 160, borderRadius: 20,
                    backgroundColor: trial.displayColor || "#ffffff",
                    boxShadow: `0 0 60px ${trial.displayColor || "#ffffff"}50`
                  }} />
                );

              default: // stroop / custom / text
                return (
                  <div style={{ textAlign: "center" }}>
                    <div style={{
                      color: trial.displayColor || "#ffffff",
                      fontSize: 72, fontWeight: 900,
                      letterSpacing: "0.06em",
                      fontFamily: "Inter, sans-serif",
                      textShadow: `0 0 40px ${trial.displayColor || "#ffffff"}40`
                    }}>
                      {trial.stimulusValue}
                    </div>
                  </div>
                );
            }
          })()}

          {/* ── Feedback Flash */}
          {phase === PHASES.FEEDBACK && lastFeedback && (
            <div style={{ textAlign: "center" }}>
              {lastFeedback.falseStart ? (
                <>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#f59e0b" }}>⚠ False Start!</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>Don't press before the target appears</div>
                </>
              ) : (
                <>
                  <div style={{
                    fontSize: 32, fontWeight: 700,
                    color: lastFeedback.isCorrect ? "var(--success)" : "var(--danger)"
                  }}>
                    {lastFeedback.isTimeout
                      ? (currentExpType === "reaction_time" ? "⏱ Too Slow" : "Timed Out")
                      : lastFeedback.isCorrect ? "✓ Correct" : "✗ Incorrect"
                    }
                  </div>
                  {lastFeedback.rt != null && (
                    <div style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>
                      {lastFeedback.rt} ms
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Bottom response area */}
        <div style={{
          padding: "20px 32px 32px", borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex", justifyContent: "center", minHeight: 100, alignItems: "center"
        }}>
          {phase === PHASES.STIMULUS && trial && (() => {
            switch (currentExpType) {
              case "reaction_time":
                return (
                  <div style={{ textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 13 }}>
                    Press <kbd style={{
                      background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 4, padding: "2px 10px", fontFamily: "monospace", fontSize: 15, color: "#fff"
                    }}>SPACE</kbd>
                  </div>
                );

              case "flanker":
                return (
                  <div style={{ display: "flex", gap: 16 }}>
                    <button
                      onClick={() => handleResponse("left")}
                      style={{
                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 12, padding: "14px 36px", color: "#ffffff", fontSize: 22,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                        transition: "all 0.12s"
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,106,247,0.25)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
                    >
                      <ArrowLeftIcon size={24} /> <span style={{ fontSize: 14 }}>Left</span>
                    </button>
                    <button
                      onClick={() => handleResponse("right")}
                      style={{
                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 12, padding: "14px 36px", color: "#ffffff", fontSize: 22,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                        transition: "all 0.12s"
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,106,247,0.25)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
                    >
                      <span style={{ fontSize: 14 }}>Right</span> <ArrowRightIcon size={24} />
                    </button>
                  </div>
                );

              case "nback":
                return (
                  <div style={{ display: "flex", gap: 16 }}>
                    {["MATCH", "NO_MATCH"].map((opt, i) => (
                      <button
                        key={opt}
                        onClick={() => handleResponse(opt)}
                        style={{
                          background: opt === "MATCH" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.1)",
                          border: `1px solid ${opt === "MATCH" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.25)"}`,
                          borderRadius: 12, padding: "14px 32px", color: "#ffffff",
                          cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                          transition: "all 0.12s"
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                      >
                        <span style={{ fontSize: 16, fontWeight: 700 }}>{opt === "MATCH" ? "Match" : "No Match"}</span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
                          [{opt === "MATCH" ? "M" : "N"}]
                        </span>
                      </button>
                    ))}
                  </div>
                );

              default: // stroop / custom
                return (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", maxWidth: 640 }}>
                    {(trial.responseOptions || []).map((opt, optIdx) => (
                      <button
                        key={optIdx} type="button"
                        onClick={() => handleResponse(opt)}
                        style={{
                          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: 10, padding: "14px 28px", color: "#ffffff",
                          fontSize: 16, fontWeight: 600, cursor: "pointer",
                          minWidth: 120, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                          transition: "all 0.12s ease"
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,106,247,0.25)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
                      >
                        <span>{opt}</span>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>[{optIdx + 1}]</span>
                      </button>
                    ))}
                  </div>
                );
            }
          })()}

          {/* During ITI or Feedback: hint text */}
          {(phase === PHASES.ITI || phase === PHASES.FEEDBACK) && (
            <div style={{ color: "rgba(255,255,255,0.1)", fontSize: 12 }}>
              {phase === PHASES.ITI ? "Get ready..." : ""}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // RENDER: Submitting
  // ─────────────────────────────────────────────────────────────────
  if (phase === PHASES.SUBMITTING) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg)", color: "var(--text-secondary)", fontFamily: "Inter, sans-serif"
      }}>
        <div style={{ textAlign: "center" }}>
          <RefreshCw size={32} className="spin" color="var(--accent)" style={{ marginBottom: 16 }} />
          <h3 style={{ color: "var(--text-primary)", fontSize: 18, marginBottom: 4 }}>Saving Experiment Responses</h3>
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Computing statistical metrics and accuracy...</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // RENDER: Completed
  // ─────────────────────────────────────────────────────────────────
  if (phase === PHASES.COMPLETED) {
    const paradigmStats = {
      flanker: summary && (
        <>
          {summary.congruentMeanRT != null && (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Congruent RT</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--success)" }}>{summary.congruentMeanRT} ms</div>
            </div>
          )}
          {summary.incongruentMeanRT != null && (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Incongruent RT</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#f59e0b" }}>{summary.incongruentMeanRT} ms</div>
            </div>
          )}
        </>
      ),
      reaction_time: summary && (
        <>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Fastest RT</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--success)" }}>{summary.fastestRT} ms</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>False Starts</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: summary.falseStarts > 0 ? "#f59e0b" : "var(--success)" }}>
              {summary.falseStarts}
            </div>
          </div>
        </>
      ),
      memory: summary && (
        <>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Hits</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--success)" }}>{summary.hits}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>False Alarms</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: summary.falseAlarms > 0 ? "#ef4444" : "var(--success)" }}>
              {summary.falseAlarms}
            </div>
          </div>
        </>
      ),
    };

    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "radial-gradient(ellipse at 50% 25%, #1d1b30 0%, #111218 75%)",
        padding: 24, fontFamily: "Inter, sans-serif"
      }}>
        <div style={{
          maxWidth: 620, width: "100%", background: "var(--bg-card)",
          border: "1px solid var(--border)", borderRadius: 16, padding: "36px 32px"
        }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px"
            }}>
              <CheckCircle2 size={32} color="var(--success)" />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
              Experiment Complete!
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Your responses have been recorded anonymously. Thank you for participating.
            </p>
          </div>

          <div style={{
            background: "var(--bg-hover)", borderRadius: 10, padding: "14px 18px",
            marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Anonymous ID</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "var(--accent)", fontFamily: "monospace" }}>{anonymousId}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--success)", fontSize: 12 }}>
              <ShieldCheck size={16} /> Verified & Saved
            </div>
          </div>

          {summary && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, textAlign: "center" }}>
                <Award size={18} color="var(--accent)" style={{ marginBottom: 6 }} />
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Accuracy</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>{summary.accuracy}%</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{summary.correctTrials}/{summary.totalTrials}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, textAlign: "center" }}>
                <Clock size={18} color="#3b82f6" style={{ marginBottom: 6 }} />
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Mean RT</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>
                  {summary.meanReactionTimeMs} <span style={{ fontSize: 13, fontWeight: 400 }}>ms</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Median: {summary.medianReactionTimeMs} ms</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, textAlign: "center" }}>
                <Zap size={18} color="#f59e0b" style={{ marginBottom: 6 }} />
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Score</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#f59e0b", marginTop: 2 }}>{summary.score}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Speed + Accuracy</div>
              </div>
            </div>
          )}

          {/* Paradigm-specific extra stats */}
          {summary && paradigmStats[expType] && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {paradigmStats[expType]}
            </div>
          )}

          {/* Trial log */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <BarChart2 size={15} /> Trial Log
            </h4>
            <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 8, background: "rgba(0,0,0,0.2)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)" }}>
                    <th style={{ padding: "8px 12px" }}>#</th>
                    <th style={{ padding: "8px 12px" }}>Stimulus</th>
                    <th style={{ padding: "8px 12px" }}>Response</th>
                    <th style={{ padding: "8px 12px" }}>Correct?</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>RT (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((r, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "8px 12px", color: "var(--text-muted)" }}>{i + 1}</td>
                      <td style={{ padding: "8px 12px", fontWeight: 600, color: r.displayColor || "inherit" }}>
                        {r.stimulusValue || `[${r.stimulusType}]`}
                      </td>
                      <td style={{ padding: "8px 12px", color: "var(--text-primary)" }}>{r.chosenOption}</td>
                      <td style={{ padding: "8px 12px" }}>
                        <span style={{ color: r.isCorrect ? "var(--success)" : "var(--danger)" }}>
                          {r.metadata?.falseStart ? "⚠ False" : r.isCorrect ? "✓ Yes" : "✗ No"}
                        </span>
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "monospace" }}>
                        {r.reactionTimeMs != null ? `${r.reactionTimeMs} ms` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <Link to="/" style={{
              display: "inline-block", background: "var(--bg-hover)", border: "1px solid var(--border)",
              color: "var(--text-primary)", padding: "10px 24px", borderRadius: 8, fontSize: 13, textDecoration: "none"
            }}>
              Finish & Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
