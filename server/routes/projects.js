const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Task = require('../models/Task');
const { protect } = require('../middleware/authMiddleware');

// All routes protected
router.use(protect);

// GET /api/projects — list all projects user is member of
router.get('/', async (req, res) => {
  try {
    console.log('GET /projects called, user:', req.user?._id);
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    }).populate('owner members', 'name initials color avatar');
    console.log('Projects found:', projects.length);
    res.json(projects);
  } catch (err) {
    console.error('GET /projects ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/projects — create project
router.post('/', async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const project = await Project.create({
      name,
      description,
      color,
      owner: req.user._id,
      members: [req.user._id],
    });
    await project.populate('owner members', 'name initials color avatar');
    req.io.emit('project:created', project);
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/projects/:id
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      'owner members',
      'name initials color avatar'
    );
    if (!project) return res.status(404).json({ message: 'Not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/projects/:id — update name/description/color/sprint
router.patch('/:id', async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true }
    ).populate('owner members', 'name initials color avatar');
    if (!project) return res.status(404).json({ message: 'Not found' });
    req.io.to(req.params.id).emit('project:updated', project);
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!project) return res.status(404).json({ message: 'Not found' });
    await Task.deleteMany({ project: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/projects/:id/invite — add member by email
// POST /api/projects/:id/invite — add member by email
router.post('/:id/invite', async (req, res) => {
  try {
    const User = require('../models/User');
    const { sendInviteEmail } = require('../utils/sendOtp');
    const invitee = await User.findOne({ email: req.body.email });

    if (!invitee) {
      // User doesn't exist — send a signup invite email
      await sendInviteEmail(req.body.email, req.user.name, activeProject?.name);
      return res.status(200).json({ message: 'Invite email sent — user needs to register first' });
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { members: invitee._id } },
      { new: true }
    ).populate('owner members', 'name initials color avatar');

    // Send notification email to existing user
    await sendInviteEmail(req.body.email, req.user.name, project.name);

    req.io.to(req.params.id).emit('project:updated', project);
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/projects/:id/guest-token — generate read-only share link
router.post('/:id/guest-token', async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ message: 'Not found' });
    const token = project.generateGuestToken();
    await project.save();
    res.json({ guestToken: token, expires: project.guestTokenExpiry });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/projects/:id/burndown — sprint burndown data
router.get('/:id/burndown', async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.id });
    const project = await Project.findById(req.params.id);
    const { startDate, endDate } = project.currentSprint;

    const days = [];
    let current = new Date(startDate);
    const end = new Date(endDate);
    const total = tasks.length;

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const completedByDay = tasks.filter(
        (t) =>
          t.status === 'done' &&
          t.updatedAt &&
          new Date(t.updatedAt).toISOString().split('T')[0] <= dateStr
      ).length;
      const sprintDay = Math.floor((current - new Date(startDate)) / (1000 * 60 * 60 * 24));
      const sprintTotal = Math.floor((end - new Date(startDate)) / (1000 * 60 * 60 * 24));
      days.push({
        date: dateStr,
        remaining: total - completedByDay,
        ideal: Math.round(total - (total / sprintTotal) * sprintDay),
      });
      current.setDate(current.getDate() + 1);
    }
    res.json({ total, days });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;