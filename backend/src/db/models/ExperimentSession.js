const mongoose = require("mongoose");

// One trial response captured at high precision
const trialResponseSchema = new mongoose.Schema(
  {
    trialIndex: { type: Number },
    trialNumber: { type: Number },
    stimulusType: { type: String },
    stimulusValue: { type: String },
    stimulus: { type: mongoose.Schema.Types.Mixed },
    correctResponse: { type: String },
    expectedResponse: { type: String },
    participantResponse: { type: String },
    chosenOption: { type: String },
    actualResponse: { type: String },
    isCorrect: { type: Boolean },
    correct: { type: Boolean },
    reactionTimeMs: { type: Number },
    reactionTime: { type: Number },
    stimulusOnsetMs: { type: Number },
    respondedAtMs: { type: Number },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false, strict: false }
);

const experimentSessionSchema = new mongoose.Schema(
  {
    experimentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Experiment",
      required: true,
      index: true,
    },
    publicId: { type: String, index: true },

    participantEmail: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
    },
    anonymousParticipantId: {
      type: String,
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ["started", "completed", "abandoned"],
      default: "started",
    },

    trialResponses: [trialResponseSchema],

    summary: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true, strict: false }
);

// Unique compound index: one session per email per experiment
experimentSessionSchema.index(
  { experimentId: 1, participantEmail: 1 },
  { unique: true }
);

const ExperimentSession = mongoose.model("ExperimentSession", experimentSessionSchema);
module.exports = ExperimentSession;
