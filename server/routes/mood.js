const express = require('express');
const router = express.Router();
const Mood = require('../models/Mood');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// POST /api/mood — log today's mood
router.post('/', async (req, res) => {
  try {
    const { emoji, label, project } = req.body;
    const date = new Date().toISOString().split('T')[0];

    // Upsert: one mood per user per project per day
    const mood = await Mood.findOneAndUpdate(
      { user: req.user._id, project, date },
      { emoji, label },
      { upsert: true, new: true }
    ).populate('user', 'name initials color');

    req.io.to(project).emit('mood:update', mood);
    res.json(mood);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/mood?project=id — all moods for a project (last 30 days)
router.get('/', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoff = thirtyDaysAgo.toISOString().split('T')[0];

    const moods = await Mood.find({
      project: req.query.project,
      date: { $gte: cutoff },
    })
      .populate('user', 'name initials color')
      .sort({ date: -1 });

    res.json(moods);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/mood/today?project=id — current user's mood today
router.get('/today', async (req, res) => {
  try {
    const date = new Date().toISOString().split('T')[0];
    const mood = await Mood.findOne({
      user: req.user._id,
      project: req.query.project,
      date,
    });
    res.json(mood || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;