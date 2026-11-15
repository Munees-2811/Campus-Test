import api from './api';

export const authService = {
  // Login user (Admin or Student)
  login: async (credentials) => {
    const data = await api.post('/auth/login', credentials);
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

  // Clear authentication session
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Local clean-up still proceeds
    } finally {
      localStorage.removeItem('campustest_token');
      localStorage.removeItem('campustest_user');
    }
  },

  // Change password for logged-in user
  changePassword: async (passwords) => {
    return await api.post('/auth/change-password', passwords);
  },

  // Forgot password request (Generates one-time reset token)
  forgotPassword: async (email) => {
    return await api.post('/auth/forgot-password', { email });
  },

  // Reset password with verified token
  resetPassword: async (payload) => {
    return await api.post('/auth/reset-password', payload);
  },

  // Admin: Create a new Student account
  createStudent: async (studentData) => {
    return await api.post('/auth/create-student', studentData);
  },

  // Admin: Get enrolled students list
  getStudents: async () => {
    return await api.get('/auth/students');
  },

  // Secure Admin Initialization
  initAdmin: async (adminData) => {
    const data = await api.post('/auth/init-admin', adminData);
    if (data.token) {
      localStorage.setItem('campustest_token', data.token);
      localStorage.setItem('campustest_user', JSON.stringify(data.user));
    }
    return data;
  },

  // Local Storage Helpers
  getStoredUser: () => {
    try {
      const user = localStorage.getItem('campustest_user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  getStoredToken: () => {
    return localStorage.getItem('campustest_token');
  }
};

export default authService;
