const mongoose = require('mongoose');
const crypto = require('crypto');

const sprintSchema = new mongoose.Schema({
  name: { type: String, default: 'Sprint 1' },
  startDate: { type: Date, default: Date.now },
  endDate: {
    type: Date,
    default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  },
});

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    color: { type: String, default: '#6c63ff' },

    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    currentSprint: { type: sprintSchema, default: () => ({}) },

    guestToken: { type: String, default: null },
    guestTokenExpiry: { type: Date, default: null },
  },
  { timestamps: true }
);

// Generate a guest token valid for 7 days
projectSchema.methods.generateGuestToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.guestToken = token;
  this.guestTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return token;
};

module.exports = mongoose.model('Project', projectSchema);