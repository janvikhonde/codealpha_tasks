// 📁 server/controllers/moodController.js
const Mood = require('../models/Mood');

// ─────────────────────────────────────────────
// POST /api/mood  — log today's mood
// ─────────────────────────────────────────────
const logMood = async (req, res) => {
  try {
    const { emoji, label, project } = req.body;
    if (!emoji) return res.status(400).json({ message: 'Emoji is required' });
    if (!project) return res.status(400).json({ message: 'Project ID is required' });

    const date = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

    const mood = await Mood.findOneAndUpdate(
      { user: req.user._id, project, date },
      { emoji, label: label || '' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('user', 'name initials color');

    req.io.to(project).emit('mood:update', mood);
    res.json(mood);
  } catch (err) {
    console.error('logMood error:', err);
    res.status(500).json({ message: 'Failed to log mood' });
  }
};

// ─────────────────────────────────────────────
// GET /api/mood?project=id  — last 30 days for project
// ─────────────────────────────────────────────
const getMoods = async (req, res) => {
  try {
    const { project } = req.query;
    if (!project) return res.status(400).json({ message: 'project query param is required' });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoff = thirtyDaysAgo.toISOString().split('T')[0];

    const moods = await Mood.find({
      project,
      date: { $gte: cutoff },
    })
      .populate('user', 'name initials color')
      .sort({ date: -1 });

    res.json(moods);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch moods' });
  }
};

// ─────────────────────────────────────────────
// GET /api/mood/today?project=id  — current user's mood today
// ─────────────────────────────────────────────
const getTodayMood = async (req, res) => {
  try {
    const { project } = req.query;
    const date = new Date().toISOString().split('T')[0];

    const mood = await Mood.findOne({ user: req.user._id, project, date });
    res.json(mood || null);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch today mood' });
  }
};

// ─────────────────────────────────────────────
// GET /api/mood/stats?project=id  — emoji counts per member
// ─────────────────────────────────────────────
const getMoodStats = async (req, res) => {
  try {
    const { project } = req.query;

    const stats = await Mood.aggregate([
      { $match: { project: require('mongoose').Types.ObjectId(project) } },
      { $group: { _id: '$emoji', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch mood stats' });
  }
};

module.exports = { logMood, getMoods, getTodayMood, getMoodStats };