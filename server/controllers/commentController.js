// 📁 server/controllers/commentController.js
const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

// ─────────────────────────────────────────────
// GET /api/comments?task=id
// ─────────────────────────────────────────────
const getComments = async (req, res) => {
  try {
    const { task } = req.query;
    if (!task) return res.status(400).json({ message: 'task query param is required' });

    const comments = await Comment.find({ task })
      .populate('author', 'name initials color avatar')
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
};

// ─────────────────────────────────────────────
// POST /api/comments  — text comment
// ─────────────────────────────────────────────
const createComment = async (req, res) => {
  try {
    const { task: taskId, text } = req.body;
    if (!taskId) return res.status(400).json({ message: 'task ID is required' });
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text is required' });

    const comment = await Comment.create({
      task: taskId,
      author: req.user._id,
      text: text.trim(),
    });

    await comment.populate('author', 'name initials color avatar');

    // Notify task assignee
    const task = await Task.findById(taskId).populate('assignee', '_id name');
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
    console.error('createComment error:', err);
    res.status(500).json({ message: 'Failed to create comment' });
  }
};

// ─────────────────────────────────────────────
// POST /api/comments/voice  — voice note upload
// ─────────────────────────────────────────────
const createVoiceComment = async (req, res) => {
  try {
    const { task: taskId, voiceDuration } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No audio file uploaded' });
    if (!taskId) return res.status(400).json({ message: 'task ID is required' });

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
    console.error('createVoiceComment error:', err);
    res.status(500).json({ message: 'Failed to upload voice note' });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/comments/:id
// ─────────────────────────────────────────────
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findOneAndDelete({
      _id: req.params.id,
      author: req.user._id,
    });

    if (!comment) return res.status(404).json({ message: 'Comment not found or unauthorized' });

    req.io.to(String(comment.task)).emit('comment:deleted', { _id: comment._id });
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete comment' });
  }
};

module.exports = { getComments, createComment, createVoiceComment, deleteComment };