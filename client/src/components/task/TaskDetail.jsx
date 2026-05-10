import { useState, useEffect } from 'react';
import useBoardStore from '../../store/boardStore';
import useAuthStore from '../../store/authStore';
import useTimer from '../../hooks/useTimer';
import CommentList from '../comments/CommentList';
import api from '../../services/api';

const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'];
const STATUS_OPTIONS = ['todo', 'inprogress', 'review', 'done'];

export default function TaskDetail() {
  const { selectedTask, clearSelectedTask, updateTask, toggleSubtask, saveTimeLog, deleteTask } =
    useBoardStore();
  const { user } = useAuthStore();
  const timer = useTimer();
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    return () => {
      if (timer.running) timer.stop();
    };
  }, [selectedTask?._id]);

  if (!selectedTask) return null;

  const task = selectedTask;
  const progress = task.subtasks?.length
    ? Math.round((task.subtasks.filter((s) => s.done).length / task.subtasks.length) * 100)
    : 0;

  const handleStopTimer = async () => {
    const secs = timer.stop();
    if (secs > 0) await saveTimeLog(task._id, secs);
  };

  const handleAIBreakdown = async () => {
    setLoadingAI(true);
    try {
      const { data } = await api.post('/ai/breakdown', { title: task.title });
      await updateTask(task._id, {
        subtasks: [...(task.subtasks || []), ...data.subtasks],
      });
    } catch {
      alert('AI breakdown failed. Check your API key.');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    await deleteTask(task._id);
  };

  return (
    <aside className="w-80 bg-dark-800 border-l border-dark-500 flex flex-col h-full flex-shrink-0 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-dark-500 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] bg-dark-600 text-gray-500 px-2 py-0.5 rounded">TASK-{task._id.slice(-3).toUpperCase()}</span>
            <select
              value={task.status}
              onChange={(e) => updateTask(task._id, { status: e.target.value })}
              className="text-[10px] bg-green-900/30 text-green-400 border-none rounded px-2 py-0.5 cursor-pointer outline-none"
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <h3 className="text-sm font-semibold text-white leading-snug">{task.title}</h3>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={handleDelete} className="text-gray-600 hover:text-red-400 text-xs p-1">🗑</button>
          <button onClick={clearSelectedTask} className="text-gray-600 hover:text-gray-300 text-xs p-1">✕</button>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {/* Time tracker */}
        <div className="bg-dark-700 rounded-lg p-3 border border-dark-500">
          <p className="text-[10px] text-gray-600 mb-1">Time tracker</p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg text-white">{timer.formatted}</span>
            <div className="ml-auto flex gap-1.5">
              {!timer.running ? (
                <button onClick={timer.start} className="btn-primary text-xs py-1 px-3">Start</button>
              ) : (
                <button onClick={handleStopTimer} className="btn-ghost text-xs py-1 px-3">Stop</button>
              )}
              <button onClick={timer.reset} className="btn-ghost text-xs py-1 px-2">Reset</button>
            </div>
          </div>
          {task.totalSeconds > 0 && (
            <p className="text-[10px] text-gray-600 mt-1">
              Total logged: {Math.floor(task.totalSeconds / 60)}m
            </p>
          )}
        </div>

        {/* Progress */}
        {task.subtasks?.length > 0 && (
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Progress</p>
            <div className="h-1.5 bg-dark-600 rounded-full mb-1">
              <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[10px] text-gray-500">
              {task.subtasks.filter((s) => s.done).length} of {task.subtasks.length} subtasks done
            </p>
          </div>
        )}

        {/* Assignee + Due + Priority */}
        <div>
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Assignee · Due</p>
          <div className="flex items-center gap-2">
            {task.assignee ? (
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold" style={{ background: task.assignee.color, color: '#fff' }}>
                  {task.assignee.initials}
                </div>
                <span className="text-xs text-gray-300">{task.assignee.name}</span>
              </div>
            ) : <span className="text-xs text-gray-600">Unassigned</span>}
            {task.dueDate && (
              <span className="text-xs text-gray-500 bg-dark-700 px-2 py-0.5 rounded ml-auto">
                {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
            <select
              value={task.priority}
              onChange={(e) => updateTask(task._id, { priority: e.target.value })}
              className="text-xs bg-orange-900/30 text-orange-400 border-none rounded px-2 py-0.5 outline-none cursor-pointer"
            >
              {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Dependencies */}
        {task.dependencies?.length > 0 && (
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Dependencies</p>
            {task.dependencies.map((dep) => (
              <span key={dep._id} className="inline-flex items-center gap-1 text-[10px] bg-red-900/20 text-red-400 rounded px-2 py-1 mr-1 mb-1">
                🔗 {dep.title}
                <span className={dep.status === 'done' ? 'text-green-500' : 'text-red-500'}>
                  {dep.status === 'done' ? '✓' : '⚠'}
                </span>
              </span>
            ))}
          </div>
        )}

        {/* Subtasks */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest">Subtasks</p>
            <button
              onClick={handleAIBreakdown}
              disabled={loadingAI}
              className="text-[10px] text-brand hover:underline"
            >
              {loadingAI ? '⏳ Generating...' : '✨ AI Breakdown'}
            </button>
          </div>
          {task.subtasks?.map((sub) => (
            <label key={sub._id} className="flex items-center gap-2 py-1 cursor-pointer group">
              <input
                type="checkbox"
                checked={sub.done}
                onChange={(e) => toggleSubtask(task._id, sub._id, e.target.checked)}
                className="accent-brand w-3.5 h-3.5"
              />
              <span className={`text-xs ${sub.done ? 'line-through text-gray-600' : 'text-gray-300'}`}>
                {sub.title}
              </span>
            </label>
          ))}
        </div>

        {/* Recurrence badge */}
        {task.recurrence && task.recurrence !== 'none' && (
          <div className="text-[10px] bg-dark-700 text-gray-500 rounded px-2 py-1 inline-flex items-center gap-1">
            🔄 Recurring: {task.recurrence}
          </div>
        )}

        {/* Comments */}
        <CommentList taskId={task._id} />
      </div>
    </aside>
  );
}