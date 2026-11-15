const express = require('express');
const router = express.Router();
const {
  loginUser,
  logoutUser,
  getMe,
  initAdmin,
  createStudent,
  getStudents,
  changePassword,
  forgotPassword,
  resetPassword,
  registerUser
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public Authentication Endpoints
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/init-admin', initAdmin);
router.post('/register', registerUser);

// Authenticated Endpoints (Any authenticated role: admin or student)
router.get('/me', protect, getMe);
router.post('/logout', protect, logoutUser);
router.post('/change-password', protect, changePassword);

// Admin-Only Student Management Endpoints
router.post('/create-student', protect, authorize('admin'), createStudent);
router.get('/students', protect, authorize('admin'), getStudents);

module.exports = router;
