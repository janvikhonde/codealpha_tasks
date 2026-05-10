import { create } from 'zustand';
import api from '../services/api';

const useBoardStore = create((set, get) => ({
  projects: [],
  activeProject: null,
  tasks: [],           // flat list for active project
  selectedTask: null,
  loading: false,

  // ── Projects ──────────────────────────────────────────────────
  fetchProjects: async () => {
    const { data } = await api.get('/projects');
    set({ projects: data });
    if (data.length && !get().activeProject) {
      get().setActiveProject(data[0]);
    }
  },

  createProject: async (payload) => {
    const { data } = await api.post('/projects', payload);
    set((s) => ({ projects: [...s.projects, data] }));
    return data;
  },

  setActiveProject: async (project) => {
    set({ activeProject: project, tasks: [], selectedTask: null, loading: true });
    const { data } = await api.get(`/tasks?project=${project._id}`);
    set({ tasks: data, loading: false });
  },

  // ── Tasks ──────────────────────────────────────────────────────
  fetchTasks: async (projectId) => {
    const { data } = await api.get(`/tasks?project=${projectId}`);
    set({ tasks: data });
  },

  createTask: async (payload) => {
    const { data } = await api.post('/tasks', payload);
    set((s) => ({ tasks: [...s.tasks, data] }));
    return data;
  },

  updateTask: async (id, payload) => {
    const { data } = await api.patch(`/tasks/${id}`, payload);
    set((s) => ({
      tasks: s.tasks.map((t) => (t._id === id ? data : t)),
      selectedTask: s.selectedTask?._id === id ? data : s.selectedTask,
    }));
    return data;
  },

  deleteTask: async (id) => {
    await api.delete(`/tasks/${id}`);
    set((s) => ({
      tasks: s.tasks.filter((t) => t._id !== id),
      selectedTask: s.selectedTask?._id === id ? null : s.selectedTask,
    }));
  },

  reorderTasks: async (projectId, reordered) => {
    // reordered = [{ _id, status, order }]
    set((s) => {
      const map = Object.fromEntries(reordered.map((r) => [r._id, r]));
      return {
        tasks: s.tasks.map((t) =>
          map[t._id] ? { ...t, status: map[t._id].status, order: map[t._id].order } : t
        ),
      };
    });
    await api.patch('/tasks/reorder/bulk', { tasks: reordered, projectId });
  },

  toggleSubtask: async (taskId, subtaskId, done) => {
    const { data } = await api.patch(`/tasks/${taskId}/subtask/${subtaskId}`, { done });
    set((s) => ({
      tasks: s.tasks.map((t) => (t._id === taskId ? data : t)),
      selectedTask: s.selectedTask?._id === taskId ? data : s.selectedTask,
    }));
  },

  saveTimeLog: async (taskId, seconds) => {
    await api.post(`/tasks/${taskId}/timelog`, { seconds });
  },

  // ── Socket-driven updates ──────────────────────────────────────
  socketTaskCreated: (task) =>
    set((s) => ({ tasks: [...s.tasks.filter((t) => t._id !== task._id), task] })),

  socketTaskUpdated: (task) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t._id === task._id ? task : t)),
      selectedTask: s.selectedTask?._id === task._id ? task : s.selectedTask,
    })),

  socketTaskDeleted: ({ _id }) =>
    set((s) => ({
      tasks: s.tasks.filter((t) => t._id !== _id),
      selectedTask: s.selectedTask?._id === _id ? null : s.selectedTask,
    })),

  socketBoardReordered: (reordered) => {
    const map = Object.fromEntries(reordered.map((r) => [r._id, r]));
    set((s) => ({
      tasks: s.tasks.map((t) =>
        map[t._id] ? { ...t, status: map[t._id].status, order: map[t._id].order } : t
      ),
    }));
  },

  // ── Selected task ──────────────────────────────────────────────
  selectTask: (task) => set({ selectedTask: task }),
  clearSelectedTask: () => set({ selectedTask: null }),
}));

export default useBoardStore;