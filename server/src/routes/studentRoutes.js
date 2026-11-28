const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getStudentDashboard,
  getStudentTests,
  getUpcomingTests,
  getArenaTests,
  getStudentResults,
  getStudentLeaderboard,
  getStudentAnalytics,
  getStudentNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getStudentProfile,
  updateStudentProfile
} = require('../controllers/studentController');

// All student routes require authentication and student role
router.use(protect);
router.use(authorize('student'));

// 1. Dashboard
router.get('/dashboard', getStudentDashboard);

// 2. Tests (Only tests assigned to the logged-in student)
router.get('/tests', getStudentTests);
router.get('/tests/upcoming', getUpcomingTests);
router.get('/tests/arena/:category', getArenaTests);

// 3. Results, Leaderboard & Analytics
router.get('/results', getStudentResults);
router.get('/leaderboard', getStudentLeaderboard);
router.get('/analytics', getStudentAnalytics);

// 4. Notifications
router.get('/notifications', getStudentNotifications);
router.patch('/notifications/read-all', markAllNotificationsRead);
router.patch('/notifications/:id/read', markNotificationRead);

// 5. Profile
router.get('/profile', getStudentProfile);
router.put('/profile', updateStudentProfile);

module.exports = router;
