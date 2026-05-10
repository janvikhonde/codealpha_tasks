const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Task = require('../models/Task');

// GET /api/guest/:token — public read-only board view
router.get('/:token', async (req, res) => {
  try {
    const project = await Project.findOne({
      guestToken: req.params.token,
      guestTokenExpiry: { $gt: new Date() },
    }).populate('owner members', 'name initials color');

    if (!project)
      return res.status(404).json({ message: 'Invalid or expired guest link' });

    const tasks = await Task.find({ project: project._id })
      .populate('assignee', 'name initials color')
      .sort({ order: 1 });

    res.json({ project, tasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;