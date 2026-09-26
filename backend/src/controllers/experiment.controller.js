const crypto = require("crypto");
const Experiment = require("../db/models/Experiment");
const ExperimentSession = require("../db/models/ExperimentSession");

// ─────────────────────────────────────────────────────────────────
// Helper: generate unique anonymous participant ID
// ─────────────────────────────────────────────────────────────────
const generateParticipantId = async () => {
  let isUnique = false;
  let id = "";
  while (!isUnique) {
    const hex = crypto.randomBytes(4).toString("hex").toUpperCase();
    id = `P-${hex}`;
    const exists = await ExperimentSession.findOne({ anonymousParticipantId: id });
    if (!exists) isUnique = true;
  }
  return id;
};

// ─────────────────────────────────────────────────────────────────
// Helper: compute statistics for trial responses
// ─────────────────────────────────────────────────────────────────
const computeSummary = (trialResponses) => {
  const normalized = trialResponses.map((t) => {
    const rt = t.reactionTimeMs != null ? t.reactionTimeMs : t.reactionTime;
    const isCorr = t.isCorrect !== undefined ? t.isCorrect : (t.correct !== undefined ? t.correct : false);
    return { ...t, reactionTimeMs: rt, isCorrect: isCorr };
  });

  const responded = normalized.filter((t) => t.reactionTimeMs != null && !t.metadata?.falseStart);
  const correct = normalized.filter((t) => t.isCorrect);

  const rts = responded.map((t) => t.reactionTimeMs).sort((a, b) => a - b);
  const mean = rts.length ? Math.round(rts.reduce((s, v) => s + v, 0) / rts.length) : 0;
  const median =
    rts.length === 0
      ? 0
      : rts.length % 2 === 0
      ? Math.round((rts[rts.length / 2 - 1] + rts[rts.length / 2]) / 2)
      : rts[Math.floor(rts.length / 2)];

  const accuracy = normalized.length ? Math.round((correct.length / normalized.length) * 100) : 0;
  const score = Math.max(0, Math.round(1000 - mean + accuracy * 5));

  // Paradigm-specific analysis
  // 1. Congruency (Stroop & Flanker)
  const congruentTrials = normalized.filter((t) => t.metadata?.congruent === true);
  const incongruentTrials = normalized.filter((t) => t.metadata?.congruent === false);

  const calcMeanRT = (list) => {
    const valid = list.filter((t) => t.reactionTimeMs != null).map((t) => t.reactionTimeMs);
    return valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 0;
  };
  const calcAcc = (list) => {
    return list.length ? Math.round((list.filter((t) => t.isCorrect).length / list.length) * 100) : 0;
  };

  const congruentAccuracy = calcAcc(congruentTrials);
  const incongruentAccuracy = calcAcc(incongruentTrials);
  const congruentMeanRT = calcMeanRT(congruentTrials);
  const incongruentMeanRT = calcMeanRT(incongruentTrials);

  // 2. Simple Reaction Time metrics
  const fastestRT = rts.length ? rts[0] : 0;
  const slowestRT = rts.length ? rts[rts.length - 1] : 0;
  const falseStarts = normalized.filter((t) => t.metadata?.falseStart === true).length;

  // 3. N-Back metrics
  const matchTrials = normalized.filter((t) => t.metadata?.isMatch === true);
  const nonMatchTrials = normalized.filter((t) => t.metadata?.isMatch === false);
  const hits = matchTrials.filter((t) => t.isCorrect).length;
  const misses = matchTrials.filter((t) => !t.isCorrect).length;
  const falseAlarms = nonMatchTrials.filter((t) => !t.isCorrect).length;
  const correctRejections = nonMatchTrials.filter((t) => t.isCorrect).length;
  const matchAccuracy = calcAcc(matchTrials);
  const nonMatchAccuracy = calcAcc(nonMatchTrials);

  const pStats = {
    congruentAccuracy,
    incongruentAccuracy,
    congruentMeanRT,
    incongruentMeanRT,
    interferenceDeltaRT: incongruentMeanRT && congruentMeanRT ? incongruentMeanRT - congruentMeanRT : 0,
    fastestRT,
    slowestRT,
    falseStarts,
    hits,
    misses,
    falseAlarms,
    correctRejections,
    matchAccuracy,
    nonMatchAccuracy,
  };

  return {
    totalTrials: trialResponses.length,
    correctTrials: correct.length,
    accuracy,
    meanReactionTimeMs: mean,
    medianReactionTimeMs: median,
    score,
    ...pStats,
    paradigmStats: pStats,
  };
};

// ─────────────────────────────────────────────────────────────────
// RESEARCHER ENDPOINTS
// ─────────────────────────────────────────────────────────────────

// 1. Create Experiment (draft)
const createExperiment = async (req, res) => {
  try {
    const { title, description, experimentType, instructions, trials, settings } = req.body;
    const researcher = req.researcher;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Experiment title is required." });
    }

    const experiment = new Experiment({
      researcherId: researcher._id,
      researcherName: researcher.name,
      title: title.trim(),
      description: description ? description.trim() : "",
      experimentType: experimentType || "custom",
      instructions:
        instructions ||
        "Follow the on-screen instructions carefully and respond as quickly and accurately as possible.",
      trials: Array.isArray(trials) ? trials : [],
      settings: settings || {},
      status: "draft",
    });

    await experiment.save();

    return res.status(201).json({
      success: true,
      message: "Experiment created as draft.",
      experiment,
    });
  } catch (err) {
    console.error("createExperiment error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error." });
  }
};

// 2. Update Experiment (title / trials / settings / instructions)
const updateExperiment = async (req, res) => {
  try {
    const { id } = req.params;
    const experiment = await Experiment.findById(id);

    if (!experiment) {
      return res.status(404).json({ success: false, message: "Experiment not found." });
    }

    // Authorization: researcher must own the experiment
    if (experiment.researcherId.toString() !== req.researcher._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const allowed = ["title", "description", "experimentType", "instructions", "trials", "settings", "status"];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        experiment[field] = req.body[field];
      }
    });

    await experiment.save();

    return res.status(200).json({
      success: true,
      message: "Experiment updated.",
      experiment,
    });
  } catch (err) {
    console.error("updateExperiment error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error." });
  }
};

// 3. Publish Experiment (draft -> active, auto-generates publicId)
const publishExperiment = async (req, res) => {
  try {
    const { id } = req.params;
    const experiment = await Experiment.findById(id);

    if (!experiment) {
      return res.status(404).json({ success: false, message: "Experiment not found." });
    }

    if (experiment.researcherId.toString() !== req.researcher._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const AUTO_GENERATED_TYPES = ["flanker", "reaction_time", "memory"];
    if (!AUTO_GENERATED_TYPES.includes(experiment.experimentType) && experiment.trials.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot publish an experiment with no trials. Add at least one trial first.",
      });
    }

    experiment.status = "active";
    await experiment.save(); // pre-save hook generates publicId

    return res.status(200).json({
      success: true,
      message: "Experiment published. Share the participant link with your students.",
      experiment,
      participantLink: `/experiment/${experiment.publicId}`,
    });
  } catch (err) {
    console.error("publishExperiment error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error." });
  }
};

// 4. Get all experiments for the authenticated researcher
const getMyExperiments = async (req, res) => {
  try {
    const experiments = await Experiment.find({ researcherId: req.researcher._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, experiments });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Failed to fetch experiments." });
  }
};

// 5. Get single experiment (researcher view – includes trials config)
const getExperimentById = async (req, res) => {
  try {
    const experiment = await Experiment.findById(req.params.id);
    if (!experiment) {
      return res.status(404).json({ success: false, message: "Experiment not found." });
    }
    if (experiment.researcherId.toString() !== req.researcher._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    return res.status(200).json({ success: true, experiment });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Failed to fetch experiment." });
  }
};

// 6. Delete Experiment
const deleteExperiment = async (req, res) => {
  try {
    const experiment = await Experiment.findById(req.params.id);
    if (!experiment) {
      return res.status(404).json({ success: false, message: "Experiment not found." });
    }
    if (experiment.researcherId.toString() !== req.researcher._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    await Experiment.deleteOne({ _id: experiment._id });
    return res.status(200).json({ success: true, message: "Experiment deleted." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Failed to delete experiment." });
  }
};

// 7. Get results for a specific experiment (researcher view – anonymized)
const getExperimentResults = async (req, res) => {
  try {
    const experiment = await Experiment.findById(req.params.id);
    if (!experiment) {
      return res.status(404).json({ success: false, message: "Experiment not found." });
    }
    if (experiment.researcherId.toString() !== req.researcher._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const sessions = await ExperimentSession.find({
      experimentId: experiment._id,
      status: "completed",
    })
      .select("-participantEmail") // do NOT return email
      .sort({ completedAt: -1 });

    return res.status(200).json({
      success: true,
      experiment: {
        _id: experiment._id,
        title: experiment.title,
        experimentType: experiment.experimentType,
        status: experiment.status,
        sessionCount: sessions.length,
      },
      sessions,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Failed to fetch results." });
  }
};

// ─────────────────────────────────────────────────────────────────
// PARTICIPANT ENDPOINTS
// ─────────────────────────────────────────────────────────────────

// 8. Get experiment metadata by publicId (participant landing page)
const getExperimentByPublicId = async (req, res) => {
  try {
    const { publicId } = req.params;
    const experiment = await Experiment.findOne({ publicId }).select(
      "title description experimentType instructions settings status trials"
    );

    if (!experiment) {
      return res.status(404).json({ success: false, message: "Experiment not found or link is invalid." });
    }

    if (experiment.status !== "active") {
      return res.status(400).json({
        success: false,
        message: `This experiment is currently ${experiment.status} and is not accepting participants.`,
      });
    }

    return res.status(200).json({ success: true, experiment });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Failed to fetch experiment." });
  }
};

// 9. Start a session (participant email registration + anonymous ID generation)
const startSession = async (req, res) => {
  try {
    const { publicId } = req.params;
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: "Email is required to join the experiment." });
    }

    const experiment = await Experiment.findOne({ publicId });
    if (!experiment) {
      return res.status(404).json({ success: false, message: "Experiment not found." });
    }
    if (experiment.status !== "active") {
      return res.status(400).json({ success: false, message: "This experiment is not currently active." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check for existing session
    const existing = await ExperimentSession.findOne({
      experimentId: experiment._id,
      participantEmail: normalizedEmail,
    });

    if (existing) {
      if (existing.status === "completed" && !experiment.settings.allowRetake) {
        return res.status(409).json({
          success: false,
          message: "You have already completed this experiment. Multiple submissions are not permitted.",
          alreadyCompleted: true,
          anonymousParticipantId: existing.anonymousParticipantId,
          summary: existing.summary,
          completedAt: existing.completedAt,
        });
      }
      // Resume in-progress session
      return res.status(200).json({
        success: true,
        message: "Resuming your experiment session.",
        sessionId: existing._id,
        anonymousParticipantId: existing.anonymousParticipantId,
        resumed: true,
        experiment: {
          title: experiment.title,
          experimentType: experiment.experimentType,
          instructions: experiment.instructions,
          trials: experiment.trials,
          settings: experiment.settings,
        },
      });
    }

    // New participant
    const anonymousParticipantId = await generateParticipantId();
    const session = new ExperimentSession({
      experimentId: experiment._id,
      publicId,
      participantEmail: normalizedEmail,
      anonymousParticipantId,
      status: "started",
      startedAt: new Date(),
    });
    await session.save();

    // Increment session counter on experiment
    await Experiment.findByIdAndUpdate(experiment._id, { $inc: { sessionCount: 1 } });

    return res.status(201).json({
      success: true,
      message: "Session started. Your anonymous participant ID has been generated.",
      sessionId: session._id,
      anonymousParticipantId,
      experiment: {
        title: experiment.title,
        experimentType: experiment.experimentType,
        instructions: experiment.instructions,
        trials: experiment.trials,
        settings: experiment.settings,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A session for this email already exists for this experiment.",
        alreadyCompleted: false,
      });
    }
    console.error("startSession error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error." });
  }
};

// 10. Submit all responses and complete the session
const submitResponses = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { trialResponses } = req.body;

    if (!Array.isArray(trialResponses)) {
      return res.status(400).json({ success: false, message: "trialResponses array is required." });
    }

    const session = await ExperimentSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found." });
    }

    if (session.status === "completed") {
      return res.status(409).json({
        success: false,
        message: "This session has already been submitted.",
        summary: session.summary,
      });
    }

    const summary = computeSummary(trialResponses);

    session.trialResponses = trialResponses;
    session.summary = summary;
    session.status = "completed";
    session.completedAt = new Date();
    await session.save();

    return res.status(200).json({
      success: true,
      message: "Experiment responses submitted successfully.",
      anonymousParticipantId: session.anonymousParticipantId,
      summary,
      completedAt: session.completedAt,
    });
  } catch (err) {
    console.error("submitResponses error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error." });
  }
};

module.exports = {
  // Researcher
  createExperiment,
  updateExperiment,
  publishExperiment,
  getMyExperiments,
  getExperimentById,
  deleteExperiment,
  getExperimentResults,
  // Participant
  getExperimentByPublicId,
  startSession,
  submitResponses,
};
