const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// ✅ FIXED: Attach io to each request BEFORE routes so controllers can use req.io
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/mood', require('./routes/mood'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/guest', require('./routes/guest'));

// Socket.io handler
require('./socket/socketHandler')(io);

// Recurring tasks cron: runs every day at midnight
cron.schedule('0 0 * * *', async () => {
  const Task = require('./models/Task');
  try {
    const recurringTasks = await Task.find({
      recurrence: { $in: ['daily', 'weekly'] },
      status: 'done',
    });

    for (const task of recurringTasks) {
      if (
        task.recurrence === 'daily' ||
        (task.recurrence === 'weekly' &&
          new Date() - new Date(task.updatedAt) >= 7 * 24 * 60 * 60 * 1000)
      ) {
        await Task.create({
          title: task.title,
          project: task.project,
          assignee: task.assignee,
          priority: task.priority,
          status: 'todo',
          recurrence: task.recurrence,
          tags: task.tags,
        });
      }
    }
    console.log('Recurring tasks regenerated');
  } catch (err) {
    console.error('Cron error:', err);
  }
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    httpServer.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => console.error('MongoDB error:', err));