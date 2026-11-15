import api from './api';

export const authService = {
  // Login user
  login: async (credentials) => {
    const data = await api.post('/auth/login', credentials);
    if (data.token) {
      localStorage.setItem('campustest_token', data.token);
      localStorage.setItem('campustest_user', JSON.stringify(data.user));
    }
    return data;
  },

  // Register user (Admin or Student)
  register: async (userData) => {
    const data = await api.post('/auth/register', userData);
    if (data.token) {
      localStorage.setItem('campustest_token', data.token);
      localStorage.setItem('campustest_user', JSON.stringify(data.user));
    }
    return data;
  },

  // Get current logged-in user profile
  getMe: async () => {
    return await api.get('/auth/me');
  },

  // Clear authentication
  logout: () => {
    localStorage.removeItem('campustest_token');
    localStorage.removeItem('campustest_user');
  },

  // Get stored user from localStorage
  getStoredUser: () => {
    try {
      const user = localStorage.getItem('campustest_user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  // Get stored token from localStorage
  getStoredToken: () => {
    return localStorage.getItem('campustest_token');
  }
};

export default authService;
