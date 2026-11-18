const supabase = require('../config/supabaseClient');

// Helper to parse description metadata
const parseDescriptionMeta = (descriptionStr) => {
  if (!descriptionStr || typeof descriptionStr !== 'string') return { description: '', meta: {} };
  const markerIndex = descriptionStr.indexOf('<!--CAMPUSTEST_META:');
  if (markerIndex === -1) return { description: descriptionStr, meta: {} };
  const cleanDescription = descriptionStr.substring(0, markerIndex).trim();
  const metaStr = descriptionStr.substring(markerIndex + '<!--CAMPUSTEST_META:'.length).replace('-->', '').trim();
  try {
    return { description: cleanDescription, meta: JSON.parse(metaStr) };
  } catch {
    return { description: cleanDescription, meta: {} };
  }
};

// Helper to format test for student
const formatStudentTest = (t, assignment = {}, submission = null) => {
  const qList = Array.isArray(t.questions) ? t.questions : [];
  const { description: cleanDesc, meta } = parseDescriptionMeta(t.description);

  // Check if results are released for this student
  let isReleased = meta.releaseResultsImmediately !== false;
  if (!isReleased && meta.releaseDate) {
    isReleased = new Date() >= new Date(meta.releaseDate);
  }

  return {
    _id: t.id,
    id: t.id,
    title: t.title,
    description: cleanDesc || t.description || '',
    category: t.category || 'General',
    durationMinutes: t.duration_minutes || 30,
    totalMarks: t.total_marks || qList.reduce((s, q) => s + (q.marks || 1), 0),
    passMarks: t.pass_marks || Math.round((t.total_marks || 10) * 0.4),
    questionsCount: qList.length,
    assessmentType: t.category || 'General',
    startTime: meta.scheduledStartTime || assignment.created_at || t.created_at,
    endTime: meta.scheduledEndTime || assignment.due_date || null,
    dueDate: meta.scheduledEndTime || assignment.due_date || null,
    assignmentStatus: assignment.status || 'pending',
    alreadySubmitted: !!submission,
    previousResult: submission
      ? {
          _id: submission.id,
          score: isReleased ? submission.score : null,
          totalMarks: submission.total_marks,
          passed: isReleased ? submission.passed : null,
          percentage: isReleased ? Math.round((submission.score / (submission.total_marks || 1)) * 100) : null,
          timeTakenSeconds: submission.time_taken_seconds,
          resultsReleased: isReleased,
          releaseDate: meta.releaseDate || null,
          createdAt: submission.created_at
        }
      : null
  };
};
          totalMarks: submission.total_marks,
          passed: submission.passed,
          percentage: Math.round((submission.score / (submission.total_marks || 1)) * 100),
          timeTakenSeconds: submission.time_taken_seconds,
          createdAt: submission.created_at
        }
      : null
  };
};

// =============================================================================
// 1. DASHBOARD OVERVIEW
// =============================================================================

const getStudentDashboard = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // 1. Fetch student assignments
    const { data: assignments, error: assignErr } = await supabase
      .from('assignments')
      .select('*, tests!test_id(*)')
      .eq('student_id', studentId);

    if (assignErr) return next(new Error(assignErr.message));

    // 2. Fetch student results
    const { data: results, error: resErr } = await supabase
      .from('results')
      .select('*, tests!test_id(id, title, category, total_marks, pass_marks, duration_minutes)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (resErr) return next(new Error(resErr.message));

    // 3. Fetch notifications count
    const { count: unreadNotifs } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', studentId)
      .eq('is_read', false);

    const totalAssigned = (assignments || []).length;
    const completedResults = results || [];
    const completedCount = completedResults.length;
    const passedCount = completedResults.filter((r) => r.passed).length;

    const averagePercentage =
      completedCount > 0
        ? Math.round(
            completedResults.reduce(
              (sum, r) => sum + (r.score / (r.total_marks || 1)) * 100,
              0
            ) / completedCount
          )
        : 0;

    const upcomingCount = Math.max(0, totalAssigned - completedCount);

    // Recent submissions
    const recentSubmissions = completedResults.slice(0, 5).map((r) => ({
      _id: r.id,
      test: r.tests ? { id: r.tests.id, title: r.tests.title, category: r.tests.category } : { title: 'Assessment' },
      score: r.score,
      totalMarks: r.total_marks,
      passed: r.passed,
      percentage: Math.round((r.score / (r.total_marks || 1)) * 100),
      timeTakenSeconds: r.time_taken_seconds,
      createdAt: r.created_at
    }));

    // Score Trajectory over time
    const scoreTrajectory = completedResults
      .slice()
      .reverse()
      .map((r, idx) => ({
        index: idx + 1,
        testTitle: r.tests?.title || `Test #${idx + 1}`,
        score: r.score,
        totalMarks: r.total_marks,
        percentage: Math.round((r.score / (r.total_marks || 1)) * 100),
        passed: r.passed,
        date: new Date(r.created_at).toLocaleDateString()
      }));

    // Category breakdown of tests taken
    const categoryScores = {};
    completedResults.forEach((r) => {
      const cat = r.tests?.category || 'General';
      if (!categoryScores[cat]) {
        categoryScores[cat] = { totalPct: 0, count: 0 };
      }
      categoryScores[cat].totalPct += (r.score / (r.total_marks || 1)) * 100;
      categoryScores[cat].count += 1;
    });

    const categoryMastery = Object.keys(categoryScores).map((cat) => ({
      category: cat,
      averagePercentage: Math.round(categoryScores[cat].totalPct / categoryScores[cat].count),
      evaluationsCount: categoryScores[cat].count
    }));

    return res.status(200).json({
      success: true,
      stats: {
        totalAssigned,
        completedCount,
        passedCount,
        failedCount: Math.max(0, completedCount - passedCount),
        averagePercentage,
        upcomingCount,
        unreadNotifications: unreadNotifs || 0,
        recentSubmissions,
        scoreTrajectory,
        categoryMastery
      }
    });
  } catch (err) {
    next(err);
  }
};

// =============================================================================
// 2. ASSIGNED TESTS & FILTERING
// =============================================================================

// @desc    Get all tests ASSIGNED to the logged-in student only
// @route   GET /api/student/tests
const getStudentTests = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // Fetch assignments for this student
    const { data: assignments, error: assignErr } = await supabase
      .from('assignments')
      .select('*, tests!test_id(*)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (assignErr) return next(new Error(assignErr.message));

    // Fetch student results to check if already taken
    const { data: submissions } = await supabase
      .from('results')
      .select('*')
      .eq('student_id', studentId);

    const submissionsMap = {};
    (submissions || []).forEach((r) => {
      submissionsMap[r.test_id] = r;
    });

    // Format assigned tests only
    const assignedTests = (assignments || [])
      .filter((a) => a.tests && a.tests.is_active)
      .map((a) => formatStudentTest(a.tests, a, submissionsMap[a.tests.id]));

    return res.status(200).json({
      success: true,
      count: assignedTests.length,
      tests: assignedTests
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get upcoming tests for the student
// @route   GET /api/student/tests/upcoming
const getUpcomingTests = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('*, tests!test_id(*)')
      .eq('student_id', studentId)
      .order('due_date', { ascending: true });

    if (error) return next(new Error(error.message));

    // Check submissions
    const { data: submissions } = await supabase
      .from('results')
      .select('test_id')
      .eq('student_id', studentId);

    const submittedSet = new Set((submissions || []).map((s) => s.test_id));

    // Filter uncompleted upcoming assignments
    const upcoming = (assignments || [])
      .filter((a) => a.tests && a.tests.is_active && !submittedSet.has(a.tests.id))
      .map((a) => formatStudentTest(a.tests, a, null));

    return res.status(200).json({
      success: true,
      count: upcoming.length,
      tests: upcoming
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get tests for specialized arenas: coding, debugging, technical, aptitude, sql
// @route   GET /api/student/tests/arena/:category
const getArenaTests = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { category } = req.params;

    const categoryMap = {
      coding: 'Coding',
      debugging: 'Debugging',
      technical: 'Technical',
      aptitude: 'Aptitude',
      sql: 'SQL'
    };

    const targetCategory = categoryMap[category.toLowerCase()] || 'General';

    // Fetch assignments for student
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('*, tests!test_id(*)')
      .eq('student_id', studentId);

    if (error) return next(new Error(error.message));

    // Fetch student's submissions
    const { data: submissions } = await supabase
      .from('results')
      .select('*')
      .eq('student_id', studentId);

    const submissionsMap = {};
    (submissions || []).forEach((r) => {
      submissionsMap[r.test_id] = r;
    });

    const arenaTests = (assignments || [])
      .filter((a) => a.tests && a.tests.is_active && a.tests.category?.toLowerCase() === targetCategory.toLowerCase())
      .map((a) => formatStudentTest(a.tests, a, submissionsMap[a.tests.id]));

    return res.status(200).json({
      success: true,
      category: targetCategory,
      count: arenaTests.length,
      tests: arenaTests
    });
  } catch (err) {
    next(err);
  }
};

// =============================================================================
// 3. RESULTS, LEADERBOARD & ANALYTICS
// =============================================================================

// @desc    Get student's own verified results with question review
// @route   GET /api/student/results
const getStudentResults = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const { data: results, error } = await supabase
      .from('results')
      .select('*, tests!test_id(id, title, category, total_marks, pass_marks, duration_minutes, questions)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) return next(new Error(error.message));

    const formatted = (results || []).map((r) => ({
      _id: r.id,
      id: r.id,
      test: r.tests
        ? {
            id: r.tests.id,
            title: r.tests.title,
            category: r.tests.category,
            totalMarks: r.tests.total_marks,
            passMarks: r.tests.pass_marks,
            durationMinutes: r.tests.duration_minutes
          }
        : null,
      score: r.score,
      totalMarks: r.total_marks,
      passed: r.passed,
      percentage: Math.round((r.score / (r.total_marks || 1)) * 100),
      timeTakenSeconds: r.time_taken_seconds,
      answers: r.answers || [],
      testQuestions: r.tests?.questions || [],
      createdAt: r.created_at
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      results: formatted
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get leaderboard standing highlighting the student
// @route   GET /api/student/leaderboard
const getStudentLeaderboard = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const { data: allResults, error } = await supabase
      .from('results')
      .select('*, profiles!student_id(id, name, email)');

    if (error) return next(new Error(error.message));

    const studentMap = {};
    (allResults || []).forEach((r) => {
      const sid = r.student_id;
      if (!studentMap[sid]) {
        studentMap[sid] = {
          studentId: sid,
          name: r.profiles?.name || 'Student',
          email: r.profiles?.email || '',
          testsCompleted: 0,
          totalScore: 0,
          maxPossibleMarks: 0,
          passedCount: 0
        };
      }
      studentMap[sid].testsCompleted++;
      studentMap[sid].totalScore += r.score;
      studentMap[sid].maxPossibleMarks += r.total_marks;
      if (r.passed) studentMap[sid].passedCount++;
    });

    const rankings = Object.values(studentMap)
      .map((s) => ({
        ...s,
        avgPercentage:
          s.maxPossibleMarks > 0 ? Math.round((s.totalScore / s.maxPossibleMarks) * 100) : 0,
        passRate:
          s.testsCompleted > 0 ? Math.round((s.passedCount / s.testsCompleted) * 100) : 0
      }))
      .sort((a, b) => {
        if (b.avgPercentage !== a.avgPercentage) return b.avgPercentage - a.avgPercentage;
        return b.totalScore - a.totalScore;
      })
      .map((item, idx) => ({
        rank: idx + 1,
        ...item,
        isMe: item.studentId === studentId
      }));

    const myStanding = rankings.find((r) => r.studentId === studentId) || {
      rank: rankings.length + 1,
      name: req.user.name,
      testsCompleted: 0,
      totalScore: 0,
      avgPercentage: 0,
      isMe: true
    };

    return res.status(200).json({
      success: true,
      myStanding,
      rankings
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get student performance analytics
// @route   GET /api/student/analytics
const getStudentAnalytics = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const { data: results, error } = await supabase
      .from('results')
      .select('*, tests!test_id(title, category, total_marks)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: true });

    if (error) return next(new Error(error.message));

    const totalEvaluations = (results || []).length;
    const passed = (results || []).filter((r) => r.passed).length;
    const failed = Math.max(0, totalEvaluations - passed);

    // Category breakdown
    const categoryMap = {
      Technical: { totalPct: 0, count: 0 },
      Coding: { totalPct: 0, count: 0 },
      Debugging: { totalPct: 0, count: 0 },
      Aptitude: { totalPct: 0, count: 0 },
      SQL: { totalPct: 0, count: 0 }
    };

    (results || []).forEach((r) => {
      const cat = r.tests?.category || 'Technical';
      if (!categoryMap[cat]) categoryMap[cat] = { totalPct: 0, count: 0 };
      categoryMap[cat].totalPct += (r.score / (r.total_marks || 1)) * 100;
      categoryMap[cat].count += 1;
    });

    const categoryRadar = Object.keys(categoryMap).map((cat) => ({
      category: cat,
      score:
        categoryMap[cat].count > 0
          ? Math.round(categoryMap[cat].totalPct / categoryMap[cat].count)
          : 0,
      evaluations: categoryMap[cat].count
    }));

    // Score Timeline
    const timeline = (results || []).map((r, i) => ({
      testIndex: `#${i + 1}`,
      title: r.tests?.title || `Test ${i + 1}`,
      percentage: Math.round((r.score / (r.total_marks || 1)) * 100),
      passed: r.passed,
      date: new Date(r.created_at).toLocaleDateString()
    }));

    return res.status(200).json({
      success: true,
      analytics: {
        totalEvaluations,
        passed,
        failed,
        passRatio: totalEvaluations > 0 ? Math.round((passed / totalEvaluations) * 100) : 0,
        categoryRadar,
        timeline
      }
    });
  } catch (err) {
    next(err);
  }
};

// =============================================================================
// 4. NOTIFICATIONS
// =============================================================================

// @desc    Get student notifications
// @route   GET /api/student/notifications
const getStudentNotifications = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false });

    if (error) return next(new Error(error.message));

    return res.status(200).json({
      success: true,
      count: (notifications || []).length,
      notifications: notifications || []
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/student/notifications/:id/read
const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) return next(new Error(error.message));

    return res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/student/notifications/read-all
const markAllNotificationsRead = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user.id);

    if (error) return next(new Error(error.message));

    return res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
};

// =============================================================================
// 5. PROFILE
// =============================================================================

// @desc    Get student profile details with academic metadata
// @route   GET /api/student/profile
const getStudentProfile = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, created_at, updated_at')
      .eq('id', studentId)
      .single();

    if (error || !profile) return res.status(404).json({ success: false, message: 'Student profile not found.' });

    // Fetch metadata from activity_logs
    const { data: metaLog } = await supabase
      .from('activity_logs')
      .select('metadata')
      .eq('entity_id', studentId)
      .eq('action', 'student_updated')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch tests completed count
    const { count: completedCount } = await supabase
      .from('results')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId);

    const metadata = metaLog?.metadata || {};

    return res.status(200).json({
      success: true,
      profile: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        rollNumber: metadata.rollNumber || 'CS-2026-STU',
        department: metadata.department || 'Computer Science & Engineering',
        batchYear: '2022 - 2026',
        accountStatus: 'Active & Verified',
        enrolledAt: profile.created_at,
        completedAssessments: completedCount || 0
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
  getStudentProfile
};
