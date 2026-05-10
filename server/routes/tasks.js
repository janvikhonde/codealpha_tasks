const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Helper — create notification and emit via socket
const notify = async (io, { recipient, type, message, project, task }) => {
  if (!recipient) return;
  try {
    const notif = await Notification.create({ recipient, type, message, project, task });
    io?.to(String(recipient)).emit('notification:new', notif);
  } catch (e) {
    console.error('Notify error:', e.message);
  }
};

// GET /api/tasks?project=id
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) filter.project = req.query.project;
    const tasks = await Task.find(filter)
      .populate('assignee', 'name initials color avatar')
      .sort({ order: 1, createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/tasks/reorder/bulk — MUST be before /:id
router.patch('/reorder/bulk', async (req, res) => {
  try {
    const { tasks } = req.body;
    await Promise.all(
      tasks.map(({ _id, status, order }) =>
        Task.findByIdAndUpdate(_id, { status, order })
      )
    );
    req.io?.to(req.body.projectId).emit('board:reordered', tasks);
    res.json({ message: 'Reordered' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tasks — create task
router.post('/', async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, createdBy: req.user._id });
    await task.populate('assignee', 'name initials color avatar');

    // Notify assignee if different from creator
    if (task.assignee && String(task.assignee._id) !== String(req.user._id)) {
      await notify(req.io, {
        recipient: task.assignee._id,
        type: 'task_assigned',
        message: `${req.user.name} assigned you "${task.title}"`,
        project: task.project,
        task: task._id,
      });
    }

    req.io?.to(String(task.project)).emit('task:created', task);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      'assignee', 'name initials color avatar'
    );
    if (!task) return res.status(404).json({ message: 'Not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/tasks/:id — update task
router.patch('/:id', async (req, res) => {
  try {
    const oldTask = await Task.findById(req.params.id);
    if (!oldTask) return res.status(404).json({ message: 'Not found' });

    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    }).populate('assignee', 'name initials color avatar');

    // Notify: new assignee
    if (
      req.body.assignee &&
      String(req.body.assignee) !== String(oldTask.assignee) &&
      String(req.body.assignee) !== String(req.user._id)
    ) {
      await notify(req.io, {
        recipient: req.body.assignee,
        type: 'task_assigned',
        message: `${req.user.name} assigned you "${task.title}"`,
        project: task.project,
        task: task._id,
      });
    }

    // Notify: status changed
    if (req.body.status && req.body.status !== oldTask.status && task.assignee) {
      if (String(task.assignee._id) !== String(req.user._id)) {
        await notify(req.io, {
          recipient: task.assignee._id,
          type: 'task_moved',
          message: `"${task.title}" moved to ${req.body.status.replace(/_/g, ' ')} by ${req.user.name}`,
          project: task.project,
          task: task._id,
        });
      }
    }

    req.io?.to(String(task.project)).emit('task:updated', task);
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/tasks/:id/subtask/:subtaskId
router.patch('/:id/subtask/:subtaskId', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Not found' });
    const sub = task.subtasks.id(req.params.subtaskId);
    if (!sub) return res.status(404).json({ message: 'Subtask not found' });
    sub.done = req.body.done;
    await task.save();
    await task.populate('assignee', 'name initials color avatar');
    req.io?.to(String(task.project)).emit('task:updated', task);
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tasks/:id/timelog
router.post('/:id/timelog', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $inc: { timeLogged: req.body.seconds } },
      { new: true }
    ).populate('assignee', 'name initials color avatar');
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Not found' });
    req.io?.to(String(task.project)).emit('task:deleted', { _id: task._id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;