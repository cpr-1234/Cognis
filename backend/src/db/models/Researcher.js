const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const researcherSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Researcher name is required'],
      trim: true,
      minlength: [1, 'Name must be at least 1 character long'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Don't return password in queries by default
    },
    role: {
      type: String,
      enum: ['researcher', 'lead_researcher', 'clinical_scientist', 'reviewer'],
      default: 'researcher',
    },
    institution: {
      type: String,
      trim: true,
      default: '',
    },
    fieldOfStudy: {
      type: String,
      trim: true,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    googleId: {
      type: String,
      sparse: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if it has been modified
researcherSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password helper
researcherSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields from JSON output
researcherSchema.methods.toJSON = function () {
  const researcherObj = this.toObject();
  delete researcherObj.password;
  delete researcherObj.__v;
  return researcherObj;
};

const Researcher = mongoose.model('Researcher', researcherSchema);

module.exports = Researcher;
