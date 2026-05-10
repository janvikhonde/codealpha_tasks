import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      set({ user: data.user, token: data.token, loading: false });
      return true;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      const email = err.response?.data?.email || null;
      set({ error: message, loading: false });
      if (err.response?.status === 403 && email) return { unverified: true, email };
      return false;
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      await api.post('/auth/register', { name, email, password });
      set({ loading: false });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Register failed', loading: false });
      return false;
    }
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null });
    }
  },

  updateProfile: async (updates) => {
    try {
      const { data } = await api.patch('/auth/profile', updates);
      set({ user: data });
      return true;
    } catch (err) {
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;