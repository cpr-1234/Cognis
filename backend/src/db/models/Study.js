const mongoose = require('mongoose');

const studySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Study title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    studyCode: {
      type: String,
      required: [true, 'Unique study code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    uniqueUrl: {
      type: String,
      trim: true,
    },
    researcherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Researcher',
    },
    researcherName: {
      type: String,
      default: 'Lead Researcher',
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed'],
      default: 'active',
    },
    submissionCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate uniqueUrl before saving if not provided
studySchema.pre('save', function () {
  if (!this.uniqueUrl && this.studyCode) {
    this.uniqueUrl = `/study/${this.studyCode}`;
  }
});

const Study = mongoose.model('Study', studySchema);

module.exports = Study;
