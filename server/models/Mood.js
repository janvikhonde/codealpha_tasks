const mongoose = require('mongoose');

const moodSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    emoji: { type: String, required: true }, // e.g. "😊"
    label: { type: String, default: '' },    // e.g. "Happy", "Stressed"
    date: { type: String, required: true },  // "YYYY-MM-DD" for easy daily grouping
  },
  { timestamps: true }
);

// One mood per user per project per day
moodSchema.index({ user: 1, project: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Mood', moodSchema);