// 📁 server/controllers/taskController.js
const Task = require('../models/Task');
const Notification = require('../models/Notification');

// ─────────────────────────────────────────────
// GET /api/tasks?project=id
// ─────────────────────────────────────────────
const getTasks = async (req, res) => {
  try {
    const { project, status, assignee, priority } = req.query;
    if (!project) return res.status(400).json({ message: 'project query param is required' });

    const filter = { project };
    if (status) filter.status = status;
    if (assignee) filter.assignee = assignee;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter)
      .populate('assignee', 'name initials color avatar')
      .populate('createdBy', 'name initials color')
      .populate('dependencies', 'title status')
      .sort({ order: 1, createdAt: 1 });

    res.json(tasks);
  } catch (err) {
    console.error('getTasks error:', err);
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
};

// ─────────────────────────────────────────────
// POST /api/tasks
// ─────────────────────────────────────────────
const createTask = async (req, res) => {
  try {
    const {
      title, description, project, assignee, priority,
      dueDate, tags, subtasks, dependencies, recurrence, status, sprint,
    } = req.body;

    if (!title) return res.status(400).json({ message: 'Task title is required' });
    if (!project) return res.status(400).json({ message: 'Project ID is required' });

    const task = await Task.create({
      title, description, project,
      assignee: assignee || null,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      tags: tags || [],
      subtasks: subtasks || [],
      dependencies: dependencies || [],
      recurrence: recurrence || 'none',
      status: status || 'todo',
      sprint: sprint || '',
      createdBy: req.user._id,
    });

    await task.populate('assignee', 'name initials color avatar');
    await task.populate('createdBy', 'name initials color');
    await task.populate('dependencies', 'title status');

    // Notify assignee if different from creator
    if (task.assignee && String(task.assignee._id) !== String(req.user._id)) {
      const notif = await Notification.create({
        recipient: task.assignee._id,
        type: 'task_assigned',
        message: `${req.user.name} assigned you "${task.title}"`,
        project: task.project,
        task: task._id,
      });
      req.io.to(String(task.assignee._id)).emit('notification:new', notif);
    }

    req.io.to(String(project)).emit('task:created', task);
    res.status(201).json(task);
  } catch (err) {
    console.error('createTask error:', err);
    res.status(500).json({ message: 'Failed to create task' });
  }
};

// ─────────────────────────────────────────────
// GET /api/tasks/:id
// ─────────────────────────────────────────────
const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name initials color avatar')
      .populate('createdBy', 'name initials color')
      .populate('dependencies', 'title status');

    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch task' });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/tasks/:id
// ─────────────────────────────────────────────
const updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('assignee', 'name initials color avatar')
      .populate('createdBy', 'name initials color')
      .populate('dependencies', 'title status');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Notify newly assigned user
    if (
      req.body.assignee &&
      String(req.body.assignee) !== String(req.user._id) &&
      task.assignee
    ) {
      const notif = await Notification.create({
        recipient: req.body.assignee,
        type: 'task_assigned',
        message: `${req.user.name} assigned you "${task.title}"`,
        project: task.project,
        task: task._id,
      });
      req.io.to(String(req.body.assignee)).emit('notification:new', notif);
    }

    // Notify if task moved to done
    if (req.body.status === 'done' && task.createdBy) {
      const notif = await Notification.create({
        recipient: task.createdBy._id,
        type: 'task_done',
        message: `"${task.title}" was marked as done`,
        project: task.project,
        task: task._id,
      });
      req.io.to(String(task.createdBy._id)).emit('notification:new', notif);
    }

    req.io.to(String(task.project)).emit('task:updated', task);
    res.json(task);
  } catch (err) {
    console.error('updateTask error:', err);
    res.status(500).json({ message: 'Failed to update task' });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/tasks/:id
// ─────────────────────────────────────────────
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    req.io.to(String(task.project)).emit('task:deleted', { _id: task._id });
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete task' });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/tasks/reorder/bulk  — drag-drop reorder
// ─────────────────────────────────────────────
const reorderTasks = async (req, res) => {
  try {
    const { tasks, projectId } = req.body;

    if (!tasks || !Array.isArray(tasks))
      return res.status(400).json({ message: 'tasks array is required' });

    const ops = tasks.map(({ _id, status, order }) => ({
      updateOne: { filter: { _id }, update: { $set: { status, order } } },
    }));

    await Task.bulkWrite(ops);

    req.io.to(projectId).emit('board:reordered', tasks);
    res.json({ message: 'Board reordered successfully' });
  } catch (err) {
    console.error('reorderTasks error:', err);
    res.status(500).json({ message: 'Failed to reorder tasks' });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/tasks/:id/subtask/:subtaskId  — toggle subtask
// ─────────────────────────────────────────────
const toggleSubtask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const sub = task.subtasks.id(req.params.subtaskId);
    if (!sub) return res.status(404).json({ message: 'Subtask not found' });

    sub.done = req.body.done;
    await task.save();

    await task.populate('assignee', 'name initials color avatar');
    await task.populate('dependencies', 'title status');

    req.io.to(String(task.project)).emit('task:updated', task);
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update subtask' });
  }
};

// ─────────────────────────────────────────────
// POST /api/tasks/:id/timelog  — save time session
// ─────────────────────────────────────────────
const addTimeLog = async (req, res) => {
  try {
    const { seconds } = req.body;
    if (!seconds || seconds <= 0)
      return res.status(400).json({ message: 'seconds must be > 0' });

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        $push: { timeLogs: { user: req.user._id, seconds, date: new Date() } },
        $inc: { totalSeconds: seconds },
      },
      { new: true }
    ).populate('assignee', 'name initials color avatar');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    req.io.to(String(task.project)).emit('task:updated', task);
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Failed to save time log' });
  }
};

module.exports = {
  getTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  reorderTasks,
  toggleSubtask,
  addTimeLog,
};