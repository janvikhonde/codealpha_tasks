import { useState } from 'react';
import useBoardStore from '../../store/boardStore';
import useAuthStore from '../../store/authStore';

export default function NewTaskModal({ onClose }) {
  const { activeProject, createTask, tasks } = useBoardStore();
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    title: '',
    priority: 'medium',
    dueDate: '',
    tags: '',
    recurrence: 'none',
    assignee: '',
    dependencies: [],
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await createTask({
      title: form.title,
      priority: form.priority,
      dueDate: form.dueDate || null,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      recurrence: form.recurrence,
      assignee: form.assignee || null,
      project: activeProject._id,
      status: 'todo',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 rounded-2xl border border-dark-500 w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">New Task</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Title *</label>
            <input className="input" placeholder="Task title..." value={form.title} onChange={set('title')} required autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Priority</label>
              <select className="input" value={form.priority} onChange={set('priority')}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Due date</label>
              <input type="date" className="input" value={form.dueDate} onChange={set('dueDate')} />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tags (comma-separated)</label>
            <input className="input" placeholder="Frontend, UI/UX, Urgent" value={form.tags} onChange={set('tags')} />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Assignee</label>
            <select className="input" value={form.assignee} onChange={set('assignee')}>
              <option value="">Unassigned</option>
              {activeProject?.members?.map((m) => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Recurrence</label>
            <select className="input" value={form.recurrence} onChange={set('recurrence')}>
              <option value="none">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Create Task</button>
          </div>
        </form>
      </div>
    </div>
  );
}