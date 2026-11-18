const express = require('express');
const router = express.Router();
const {
  getTests,
  getTestById,
  startAttempt,
  saveAnswer,
  createTest,
  updateTest,
  deleteTest,
  submitTest,
  getMyResults,
  getTestResultsAdmin
} = require('../controllers/testController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Student specific results route
router.get('/results/my', protect, authorize('student'), getMyResults);

// General tests route (both admin and student)
router.route('/')
  .get(protect, getTests)
  .post(protect, authorize('admin'), createTest);

// Single test routes
router.route('/:id')
  .get(protect, getTestById)
  .put(protect, authorize('admin'), updateTest)
  .delete(protect, authorize('admin'), deleteTest);

// Student interactive test taking routes
router.post('/:id/start', protect, authorize('student'), startAttempt);
router.post('/:id/save-answer', protect, authorize('student'), saveAnswer);
router.post('/:id/submit', protect, authorize('student'), submitTest);

// Admin view results for a test
router.get('/:id/results', protect, authorize('admin'), getTestResultsAdmin);

module.exports = router;
