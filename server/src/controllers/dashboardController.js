const supabase = require('../config/supabaseClient');

const formatResult = (r) => ({
  _id: r.id,
  test: r.test || r.test_id,
  student: r.student || r.student_id,
  answers: r.answers,
  score: r.score,
  totalMarks: r.total_marks,
  passed: r.passed,
  timeTakenSeconds: r.time_taken_seconds,
  createdAt: r.created_at,
});

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const isStudent = req.user.role === 'student';

    if (!isStudent) {
      // Admin dashboard statistics
      const [testsRes, studentsRes, resultsRes, recentRes, passedRes] = await Promise.all([
        supabase.from('tests').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('results').select('id', { count: 'exact', head: true }),
        supabase
          .from('results')
          .select('*, profiles!student_id(name, email), tests!test_id(title, category)')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('results').select('id', { count: 'exact', head: true }).eq('passed', true),
      ]);

      if (testsRes.error) return next(new Error(testsRes.error.message));
      if (studentsRes.error) return next(new Error(studentsRes.error.message));
      if (resultsRes.error) return next(new Error(resultsRes.error.message));
      if (recentRes.error) return next(new Error(recentRes.error.message));
      if (passedRes.error) return next(new Error(passedRes.error.message));

      const passRate =
        (resultsRes.count || 0) > 0
          ? Math.round(((passedRes.count || 0) / resultsRes.count) * 100)
          : 0;

      const recentResults = (recentRes.data || []).map((r) => {
        const formatted = formatResult(r);
        if (r.profiles) {
          formatted.student = { name: r.profiles.name, email: r.profiles.email };
        }
        if (r.tests) {
          formatted.test = { title: r.tests.title, category: r.tests.category };
        }
        return formatted;
      });

      return res.json({
        success: true,
        stats: {
          totalTests: testsRes.count || 0,
          totalStudents: studentsRes.count || 0,
          totalSubmissions: resultsRes.count || 0,
          passRate,
          recentResults,
        },
      });
    }

    // Student dashboard statistics
    const [availableRes, myResultsRes] = await Promise.all([
      supabase.from('tests').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase
        .from('results')
        .select('*, tests!test_id(id, title, category, total_marks, pass_marks)')
        .eq('student_id', req.user.id)
        .order('created_at', { ascending: false }),
    ]);

    if (availableRes.error) return next(new Error(availableRes.error.message));
    if (myResultsRes.error) return next(new Error(myResultsRes.error.message));

    const myResults = myResultsRes.data || [];
    const testsTaken = myResults.length;
    const testsPassed = myResults.filter((r) => r.passed).length;
    const averagePercentage =
      testsTaken > 0
        ? Math.round(
            myResults.reduce(
              (acc, r) => acc + (r.score / (r.total_marks || 1)) * 100,
              0
            ) / testsTaken
          )
        : 0;

    const recentSubmissions = myResults.slice(0, 5).map((r) => ({
      ...formatResult(r),
      test: r.tests
        ? {
            _id: r.tests.id,
            title: r.tests.title,
            category: r.tests.category,
            totalMarks: r.tests.total_marks,
            passMarks: r.tests.pass_marks,
          }
        : r.test_id,
    }));

    return res.json({
      success: true,
      stats: {
        availableTests: availableRes.count || 0,
        testsTaken,
        testsPassed,
        averagePercentage,
        recentSubmissions,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats,
};
