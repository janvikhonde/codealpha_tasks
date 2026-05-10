const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Either text OR voiceUrl will be set
    text: { type: String, default: '' },
    voiceUrl: { type: String, default: null }, // path to uploaded .webm file
    voiceDuration: { type: Number, default: null }, // seconds
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);