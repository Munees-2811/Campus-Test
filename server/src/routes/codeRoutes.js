const express = require('express');
const router = express.Router();
const { runCode, submitCode, getSubmissionStatus } = require('../controllers/codeExecutionController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Custom input execution (accessible to both students and admins)
router.post('/run', protect, runCode);

// Submit code against test cases (student only)
router.post('/submit', protect, authorize('student'), submitCode);

// Get submission status and execution details
router.get('/status/:submissionId', protect, getSubmissionStatus);

module.exports = router;
