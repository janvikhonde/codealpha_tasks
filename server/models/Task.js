const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  done: { type: Boolean, default: false },
});

const timeLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  seconds: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
});

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['todo', 'inprogress', 'review', 'done'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    tags: [{ type: String }],
    dueDate: { type: Date, default: null },
    subtasks: [subtaskSchema],
    // Task dependencies — this task is blocked by these task IDs
    dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    // Time tracking
    timeLogs: [timeLogSchema],
    totalSeconds: { type: Number, default: 0 },
    // Recurring
    recurrence: {
      type: String,
      enum: ['none', 'daily', 'weekly'],
      default: 'none',
    },
    // Board ordering index within its column
    order: { type: Number, default: 0 },
    // Sprint label (e.g. "Sprint 3")
    sprint: { type: String, default: '' },
  },
  { timestamps: true }
);

// Virtual: % of subtasks completed
taskSchema.virtual('progress').get(function () {
  if (!this.subtasks.length) return 0;
  const done = this.subtasks.filter((s) => s.done).length;
  return Math.round((done / this.subtasks.length) * 100);
});

taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Task', taskSchema);