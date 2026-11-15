import api from './api';

export const adminService = {
  // 1. Dashboard & Analytics
  getDashboard: async () => {
    return await api.get('/admin/dashboard');
  },
  getAnalytics: async () => {
    return await api.get('/admin/analytics');
  },

  // 2. Student Management
  getStudents: async (params = {}) => {
    return await api.get('/admin/students', { params });
  },
  createStudent: async (studentData) => {
    return await api.post('/admin/students', studentData);
  },
  updateStudent: async (id, studentData) => {
    return await api.put(`/admin/students/${id}`, studentData);
  },
  toggleStudentStatus: async (id, isActive) => {
    return await api.patch(`/admin/students/${id}/status`, { isActive });
  },
  generateTempCredentials: async (id) => {
    return await api.post(`/admin/students/${id}/temp-credentials`);
  },
  resetStudentPassword: async (id, newPassword) => {
    return await api.post(`/admin/students/${id}/reset-password`, { newPassword });
  },
  bulkImportStudents: async (students) => {
    return await api.post('/admin/students/bulk-import', { students });
  },

  // 3. Question Bank
  getQuestionBank: async (params = {}) => {
    return await api.get('/admin/questions', { params });
  },
  addQuestionToBank: async (questionData) => {
    return await api.post('/admin/questions', questionData);
  },

  // 4. Test Assignments & Schedules
  getAssignments: async () => {
    return await api.get('/admin/assignments');
  },
  createAssignment: async (payload) => {
    return await api.post('/admin/assignments', payload);
  },
  deleteAssignment: async (id) => {
    return await api.delete(`/admin/assignments/${id}`);
  },
  getSchedules: async () => {
    return await api.get('/admin/schedules');
  },
  updateSchedule: async (payload) => {
    return await api.post('/admin/schedules', payload);
  },

  // 5. Live Monitoring
  getLiveMonitoring: async () => {
    return await api.get('/admin/monitoring/live');
  },
  forceSubmitAttempt: async (attemptId) => {
    return await api.post(`/admin/monitoring/force-submit/${attemptId}`);
  },

  // 6. Results & Leaderboard
  getResults: async (params = {}) => {
    return await api.get('/admin/results', { params });
  },
  getLeaderboard: async (params = {}) => {
    return await api.get('/admin/leaderboard', { params });
  },

  // 7. Notifications
  getNotifications: async () => {
    return await api.get('/admin/notifications');
  },
  broadcastNotification: async (payload) => {
    return await api.post('/admin/notifications/broadcast', payload);
  },
  deleteNotification: async (id) => {
    return await api.delete(`/admin/notifications/${id}`);
  },

  // 8. Settings
  getSettings: async () => {
    return await api.get('/admin/settings');
  },
  updateSettings: async (settings) => {
    return await api.put('/admin/settings', settings);
  }
};

export default adminService;
