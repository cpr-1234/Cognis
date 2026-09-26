const mongoose = require("mongoose");

// Each trial in a block - generic config object for flexibility
const trialSchema = new mongoose.Schema(
  {
    order: { type: Number, default: 0 },
    stimulusType: { type: String, default: "text" },
    stimulusValue: { type: String, default: "" },
    displayColor: { type: String, default: "" },
    correctResponse: { type: String, default: "" },
    responseOptions: [{ type: String }],
    stimulusDurationMs: { type: Number, default: 0 },
    itiMs: { type: Number, default: 500 },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false, strict: false }
);

const experimentSchema = new mongoose.Schema(
  {
    researcherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Researcher",
      required: true,
      index: true,
    },
    researcherName: { type: String, default: "Researcher" },
    title: {
      type: String,
      required: [true, "Experiment title is required"],
      trim: true,
    },
    description: { type: String, trim: true, default: "" },
    experimentType: { type: String, default: "custom", trim: true },
    instructions: {
      type: String,
      default:
        "Follow the on-screen instructions carefully and respond as quickly and accurately as possible.",
    },
    trials: [trialSchema],
    status: {
      type: String,
      enum: ["draft", "active", "paused", "completed"],
      default: "draft",
    },
    publicId: { type: String, unique: true, sparse: true },
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    sessionCount: { type: Number, default: 0 },
  },
  { timestamps: true, strict: false }
);

// Auto-generate publicId when experiment is published (status -> active)
experimentSchema.pre("save", function () {
  if (this.status === "active" && !this.publicId) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";
    for (let i = 0; i < 8; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.publicId = id;
  }
});

const Experiment = mongoose.model("Experiment", experimentSchema);
module.exports = Experiment;
