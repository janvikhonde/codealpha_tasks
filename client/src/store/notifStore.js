import { create } from 'zustand';
import api from '../services/api';

const useNotifStore = create((set) => ({
  notifications: [],
  unreadCount: 0,

  fetchNotifications: async () => {
    try {
      const { data } = await api.get('/notifications');
      set({
        notifications: data,
        unreadCount: data.filter((n) => !n.read).length,
      });
    } catch (err) {
      console.error('Failed to fetch notifications:', err.message);
    }
  },

  markRead: async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      set((s) => ({
        notifications: s.notifications.map((n) =>
          n._id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, s.unreadCount - 1),
      }));
    } catch (err) {
      console.error('Failed to mark read:', err.message);
    }
  },

  markAllRead: async () => {
    try {
      await api.patch('/notifications/read-all');
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error('Failed to mark all read:', err.message);
    }
  },

  deleteNotif: async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      set((s) => {
        const notif = s.notifications.find((n) => n._id === id);
        return {
          notifications: s.notifications.filter((n) => n._id !== id),
          unreadCount: notif && !notif.read
            ? Math.max(0, s.unreadCount - 1)
            : s.unreadCount,
        };
      });
    } catch (err) {
      console.error('Failed to delete notification:', err.message);
    }
  },

  clearAll: async () => {
    try {
      await api.delete('/notifications');
      set({ notifications: [], unreadCount: 0 });
    } catch (err) {
      console.error('Failed to clear notifications:', err.message);
    }
  },

  // Called by socket when a new notification arrives in real-time
  addNotification: (notif) =>
    set((s) => ({
      notifications: [notif, ...s.notifications],
      unreadCount: s.unreadCount + 1,
    })),
}));

export default useNotifStore;