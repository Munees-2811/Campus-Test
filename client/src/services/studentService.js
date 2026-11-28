import api from './api';

export const studentService = {
  // 1. Dashboard
  getDashboard: async () => {
    return await api.get('/student/dashboard');
  },

  // 2. Tests (Only tests assigned to the logged-in student)
  getAssignedTests: async () => {
    return await api.get('/student/tests');
  },
  getUpcomingTests: async () => {
    return await api.get('/student/tests/upcoming');
  },
  getArenaTests: async (category) => {
    return await api.get(`/student/tests/arena/${category}`);
  },

  // 3. Results & Leaderboard
  getResults: async () => {
    return await api.get('/student/results');
  },
  getLeaderboard: async () => {
    return await api.get('/student/leaderboard');
  },
  getAnalytics: async () => {
    return await api.get('/student/analytics');
  },

  // 4. Notifications
  getNotifications: async () => {
    return await api.get('/student/notifications');
  },
  markNotificationRead: async (id) => {
    return await api.patch(`/student/notifications/${id}/read`);
  },
  markAllNotificationsRead: async () => {
    return await api.patch('/student/notifications/read-all');
  },

  // 5. Profile
  getProfile: async () => {
    return await api.get('/student/profile');
  },
  updateProfile: async (payload) => {
    return await api.put('/student/profile', payload);
  }
};

export default studentService;
