/**
 * Socket Handler
 * Events used:
 *   Client emits  → Server listens
 *   join:project  { projectId }   — join a project room
 *   join:task     { taskId }      — join a task detail room
 *   leave:project { projectId }
 *   leave:task    { taskId }
 *   task:typing   { taskId, userName } — someone is typing a comment
 *
 *   Server emits → Clients
 *   task:created, task:updated, task:deleted
 *   comment:new, comment:deleted
 *   board:reordered
 *   project:updated
 *   mood:update
 *   notification:new  — sent to specific user room
 *   user:online       — broadcast when user connects
 *   user:offline      — broadcast when user disconnects
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Map userId -> socketId for online tracking
const onlineUsers = new Map();

module.exports = (io) => {
  // Auth middleware for socket connections
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name initials color');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = String(socket.user._id);
    onlineUsers.set(userId, socket.id);

    // Join personal room for targeted notifications
    socket.join(userId);

    // Broadcast this user is online
    socket.broadcast.emit('user:online', { userId, name: socket.user.name });

    // ── Project room ─────────────────────────────────────────────
    socket.on('join:project', ({ projectId }) => {
      socket.join(projectId);
    });

    socket.on('leave:project', ({ projectId }) => {
      socket.leave(projectId);
    });

    // ── Task room (for comment typing indicators) ─────────────────
    socket.on('join:task', ({ taskId }) => {
      socket.join(taskId);
    });

    socket.on('leave:task', ({ taskId }) => {
      socket.leave(taskId);
    });

    // Typing indicator in comment box
    socket.on('task:typing', ({ taskId, userName }) => {
      socket.to(taskId).emit('task:typing', { userName });
    });

    // ── Disconnect ────────────────────────────────────────────────
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      socket.broadcast.emit('user:offline', { userId });
    });
  });
};