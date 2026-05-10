const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Task = require('../models/Task');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.use(protect);

// GET /api/comments?task=id
router.get('/', async (req, res) => {
  try {
    const comments = await Comment.find({ task: req.query.task })
      .populate('author', 'name initials color avatar')
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/comments — text comment
router.post('/', async (req, res) => {
  try {
    const { task: taskId, text } = req.body;
    const comment = await Comment.create({
      task: taskId,
      author: req.user._id,
      text,
    });
    await comment.populate('author', 'name initials color avatar');

    // Notify task assignee
    const task = await Task.findById(taskId).populate('assignee', '_id');
    if (task?.assignee && String(task.assignee._id) !== String(req.user._id)) {
      const notif = await Notification.create({
        recipient: task.assignee._id,
        type: 'comment_added',
        message: `${req.user.name} commented on "${task.title}"`,
        project: task.project,
        task: taskId,
      });
      req.io.to(String(task.assignee._id)).emit('notification:new', notif);
    }

    req.io.to(taskId).emit('comment:new', comment);
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/comments/voice — voice note upload
router.post('/voice', upload.single('audio'), async (req, res) => {
  try {
    const { task: taskId, voiceDuration } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No audio file' });

    const voiceUrl = `/uploads/voice/${req.file.filename}`;
    const comment = await Comment.create({
      task: taskId,
      author: req.user._id,
      voiceUrl,
      voiceDuration: Number(voiceDuration) || 0,
    });
    await comment.populate('author', 'name initials color avatar');

    req.io.to(taskId).emit('comment:new', comment);
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/comments/:id
router.delete('/:id', async (req, res) => {
  try {
    const comment = await Comment.findOneAndDelete({
      _id: req.params.id,
      author: req.user._id,
    });
    if (!comment) return res.status(404).json({ message: 'Not found' });
    req.io.to(String(comment.task)).emit('comment:deleted', { _id: comment._id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;