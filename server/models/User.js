// 📁 server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AVATAR_COLORS = [
  '#6c63ff','#4cbf9a','#e05a5a','#e0a040','#4c9fea','#e05aae','#5ab4e0',
];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    initials: { type: String, maxlength: 2 },
    color: {
      type: String,
      default: () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    },
    avatar:   { type: String, default: '' },
    role:     { type: String, enum: ['user', 'admin'], default: 'user' },
    lastSeen: { type: Date, default: Date.now },

    // ── OTP Verification Fields ──────────────────────────────────────────────
    isVerified:  { type: Boolean, default: false },
    otpCode:     { type: String,  default: undefined },
    otpExpiry:   { type: Date,    default: undefined },
    otpAttempts: { type: Number,  default: 0 },       // brute-force guard
  },
  { timestamps: true }
);

// ── Pre-save hooks ────────────────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  // Hash password only when changed
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }

  // Auto-generate initials from name
  if (this.isModified('name') || !this.initials) {
    const parts = this.name.trim().split(/\s+/);
    this.initials =
      parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0].slice(0, 2).toUpperCase();
  }

  next();
});

// ── Instance Methods ──────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Returns true if OTP is valid and not expired
userSchema.methods.verifyOtp = function (inputOtp) {
  if (!this.otpCode || !this.otpExpiry) return false;
  if (this.otpExpiry < new Date()) return false;
  return this.otpCode === inputOtp;
};

// Strip sensitive fields before sending to client
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otpCode;
  delete obj.otpExpiry;
  delete obj.otpAttempts;
  return obj;
};

// ── Static Methods ────────────────────────────────────────────────────────────
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// ── Indexes ───────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);