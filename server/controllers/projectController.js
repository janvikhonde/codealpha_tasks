// 📁 server/controllers/projectController.js
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

// ─────────────────────────────────────────────
// GET /api/projects  — all projects for current user
// ─────────────────────────────────────────────
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    })
      .populate('owner', 'name initials color avatar')
      .populate('members', 'name initials color avatar')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (err) {
    console.error('getProjects error:', err);
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
};

// ─────────────────────────────────────────────
// POST /api/projects  — create a project
// ─────────────────────────────────────────────
const createProject = async (req, res) => {
  try {
    const { name, description, color, sprintName, sprintStart, sprintEnd } = req.body;

    if (!name) return res.status(400).json({ message: 'Project name is required' });

    const project = await Project.create({
      name,
      description: description || '',
      color: color || '#6c63ff',
      owner: req.user._id,
      members: [req.user._id],
      currentSprint: {
        name: sprintName || 'Sprint 1',
        startDate: sprintStart ? new Date(sprintStart) : new Date(),
        endDate: sprintEnd
          ? new Date(sprintEnd)
          : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    await project.populate('owner members', 'name initials color avatar');

    // Broadcast to all connected clients
    req.io.emit('project:created', project);

    res.status(201).json(project);
  } catch (err) {
    console.error('createProject error:', err);
    res.status(500).json({ message: 'Failed to create project' });
  }
};

// ─────────────────────────────────────────────
// GET /api/projects/:id
// ─────────────────────────────────────────────
const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name initials color avatar')
      .populate('members', 'name initials color avatar');

    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Check membership
    const isMember =
      String(project.owner._id) === String(req.user._id) ||
      project.members.some((m) => String(m._id) === String(req.user._id));

    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch project' });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/projects/:id
// ─────────────────────────────────────────────
const updateProject = async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('owner members', 'name initials color avatar');

    if (!project) return res.status(404).json({ message: 'Project not found or unauthorized' });

    req.io.to(req.params.id).emit('project:updated', project);
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update project' });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/projects/:id
// ─────────────────────────────────────────────
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!project) return res.status(404).json({ message: 'Project not found or unauthorized' });

    // Delete all related tasks
    await Task.deleteMany({ project: req.params.id });

    req.io.emit('project:deleted', { _id: req.params.id });
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete project' });
  }
};

// ─────────────────────────────────────────────
// POST /api/projects/:id/invite
// ─────────────────────────────────────────────
const inviteMember = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const invitee = await User.findOne({ email: email.toLowerCase() });
    if (!invitee) return res.status(404).json({ message: 'No user found with that email' });

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { members: invitee._id } },
      { new: true }
    ).populate('owner members', 'name initials color avatar');

    if (!project) return res.status(404).json({ message: 'Project not found' });

    req.io.to(req.params.id).emit('project:updated', project);
    // Notify the invited user
    req.io.to(String(invitee._id)).emit('notification:new', {
      message: `You were added to project "${project.name}"`,
      type: 'task_assigned',
    });

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Failed to invite member' });
  }
};

// ─────────────────────────────────────────────
// POST /api/projects/:id/guest-token
// ─────────────────────────────────────────────
const generateGuestToken = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found or unauthorized' });

    const token = project.generateGuestToken();
    await project.save();

    res.json({
      guestToken: token,
      expires: project.guestTokenExpiry,
      shareUrl: `${process.env.CLIENT_URL}/guest/${token}`,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate guest token' });
  }
};

// ─────────────────────────────────────────────
// GET /api/projects/:id/burndown
// ─────────────────────────────────────────────
const getBurndown = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const tasks = await Task.find({ project: req.params.id });
    const { startDate, endDate } = project.currentSprint;

    const days = [];
    let current = new Date(startDate);
    const end = new Date(endDate);
    const total = tasks.length;
    const sprintDays = Math.max(
      1,
      Math.floor((end - new Date(startDate)) / (1000 * 60 * 60 * 24))
    );

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const sprintDay = Math.floor(
        (current - new Date(startDate)) / (1000 * 60 * 60 * 24)
      );
      const completedByDay = tasks.filter(
        (t) =>
          t.status === 'done' &&
          t.updatedAt &&
          new Date(t.updatedAt).toISOString().split('T')[0] <= dateStr
      ).length;

      days.push({
        date: dateStr,
        remaining: total - completedByDay,
        ideal: Math.round(total - (total / sprintDays) * sprintDay),
        completed: completedByDay,
      });
      current.setDate(current.getDate() + 1);
    }

    res.json({ total, days, sprint: project.currentSprint });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate burndown data' });
  }
};

module.exports = {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  inviteMember,
  generateGuestToken,
  getBurndown,
};