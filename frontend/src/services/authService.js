import api from './api.js';
import { STORAGE_KEYS } from '../utils/constants.js';

const authService = {
  // Login
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.data.token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, response.data.data.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.data.user));
    }
    return response.data.data;
  },

  // Register
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.data.token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, response.data.data.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.data.user));
    }
    return response.data.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    window.location.href = '/login';
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data.data || response.data;
  },

  // Update profile
  updateProfile: async (userData) => {
    const response = await api.put('/auth/profile', userData);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.data.user));
    return response.data.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.post('/auth/change-password', passwordData);
    return response.data.data || response.data;
  }
};

export default authService;
