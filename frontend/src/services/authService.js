import api from './api.js';
import { STORAGE_KEYS } from '../utils/constants.js';

const authService = {
  // Login
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    console.log('Auth login response:', response);
    console.log('response.data:', response.data);
    
    // Check both possible response structures
    const authData = response.data.data || response.data;
    console.log('Extracted auth data:', authData);
    
    if (authData?.token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, authData.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authData.user));
    }
    return authData;
  },

  // Register
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    const authData = response.data.data || response.data;
    if (authData?.token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, authData.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authData.user));
    }
    return authData;
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
    return response.data.data?.user || response.data.user || response.data;
  },

  // Update profile
  updateProfile: async (userData) => {
    const response = await api.put('/auth/profile', userData);
    const user = response.data.data?.user || response.data.user;
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
    return response.data.data || response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.post('/auth/change-password', passwordData);
    return response.data.data || response.data;
  }
};

export default authService;
