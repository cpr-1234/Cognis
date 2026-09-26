const mongoose = require('mongoose');

const studentSubmissionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Student email is required'],
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    studyCode: {
      type: String,
      required: [true, 'Study code / link identifier is required'],
      uppercase: true,
      trim: true,
    },
    studyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Study',
    },
    anonymousId: {
      type: String,
      required: [true, 'Anonymous student ID is required'],
      unique: true,
      trim: true,
    },
    hasSubmitted: {
      type: Boolean,
      default: false,
    },
    reading: {
      reactionTimeMs: {
        type: Number,
      },
      accuracy: {
        type: Number,
      },
      score: {
        type: Number,
      },
      trialsCompleted: {
        type: Number,
      },
      metrics: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      notes: {
        type: String,
        default: '',
      },
    },
    submittedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// CRITICAL: Unique compound index on { email, studyCode }
// Enforces that a student can only ever submit one reading per combination of email and study link
studentSubmissionSchema.index({ email: 1, studyCode: 1 }, { unique: true });

const StudentSubmission = mongoose.model('StudentSubmission', studentSubmissionSchema);

module.exports = StudentSubmission;
