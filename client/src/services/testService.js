import api from './api';

export const testService = {
  // Fetch tests list (admin sees all, student sees active)
  getTests: async () => {
    return await api.get('/tests');
  },

  // Fetch test details by id
  getTestById: async (id) => {
    return await api.get(`/tests/${id}`);
  },

  // Create new test (Admin only)
  createTest: async (testData) => {
    return await api.post('/tests', testData);
  },

  // Update existing test (Admin only)
  updateTest: async (id, testData) => {
    return await api.put(`/tests/${id}`, testData);
  },

  // Delete test (Admin only)
  deleteTest: async (id) => {
    return await api.delete(`/tests/${id}`);
  },

  // Start interactive test attempt
  startAttempt: async (id) => {
    return await api.post(`/tests/${id}/start`);
  },

  // Auto-save question answer
  saveAnswer: async (id, payload) => {
    return await api.post(`/tests/${id}/save-answer`, payload);
  },

  // Submit test answers (Student only)
  submitTest: async (id, payload) => {
    return await api.post(`/tests/${id}/submit`, payload);
  },

  // Get student's previous test results
  getMyResults: async () => {
    return await api.get('/tests/results/my');
  },

  // Get all submissions for a test (Admin only)
  getTestResultsAdmin: async (id) => {
    return await api.get(`/tests/${id}/results`);
  },

  // Get dashboard metrics
  getDashboardStats: async () => {
    return await api.get('/dashboard/stats');
  },

  // Code Arena & Judge0 Integration
  runCode: async (payload) => {
    return await api.post('/code/run', payload);
  },

  submitCode: async (payload) => {
    return await api.post('/code/submit', payload);
  },

  getSubmissionStatus: async (submissionId) => {
    return await api.get(`/code/status/${submissionId}`);
  }
};

export default testService;
