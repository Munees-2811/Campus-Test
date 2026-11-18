const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAdminDashboard,
  getAdminAnalytics,
  getStudents,
  createStudent,
  updateStudent,
  toggleStudentStatus,
  generateTempCredentials,
  resetStudentPassword,
  bulkImportStudents,
  getQuestionBank,
  addQuestionToBank,
  updateQuestionInBank,
  deleteQuestionFromBank,
  getAssignments,
  createAssignment,
  deleteAssignment,
  getSchedules,
  updateSchedule,
  getLiveMonitoring,
  forceSubmitAttempt,
  getAdminResults,
  getLeaderboard,
  getAdminNotifications,
  broadcastNotification,
  deleteNotification,
  getAdminSettings,
  updateAdminSettings
} = require('../controllers/adminController');

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// 1. Dashboard & Analytics
router.get('/dashboard', getAdminDashboard);
router.get('/analytics', getAdminAnalytics);

// 2. Student Management
router.get('/students', getStudents);
router.post('/students', createStudent);
router.put('/students/:id', updateStudent);
router.patch('/students/:id/status', toggleStudentStatus);
router.post('/students/:id/temp-credentials', generateTempCredentials);
router.post('/students/:id/reset-password', resetStudentPassword);
router.post('/students/bulk-import', bulkImportStudents);

// 3. Question Bank
router.get('/questions', getQuestionBank);
router.post('/questions', addQuestionToBank);
router.put('/questions/:id', updateQuestionInBank);
router.delete('/questions/:id', deleteQuestionFromBank);

// 4. Assignments & Schedules
router.get('/assignments', getAssignments);
router.post('/assignments', createAssignment);
router.delete('/assignments/:id', deleteAssignment);

router.get('/schedules', getSchedules);
router.post('/schedules', updateSchedule);

// 5. Live Monitoring
router.get('/monitoring/live', getLiveMonitoring);
router.post('/monitoring/force-submit/:attemptId', forceSubmitAttempt);

// 6. Results & Leaderboard
router.get('/results', getAdminResults);
router.get('/leaderboard', getLeaderboard);

// 7. Notifications
router.get('/notifications', getAdminNotifications);
router.post('/notifications/broadcast', broadcastNotification);
router.delete('/notifications/:id', deleteNotification);

// 8. Settings
router.get('/settings', getAdminSettings);
router.put('/settings', updateAdminSettings);

module.exports = router;
