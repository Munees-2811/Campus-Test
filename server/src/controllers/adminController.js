const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const supabase = require('../config/supabaseClient');

// Helper: Format user
const formatStudent = (u, meta = {}) => ({
  _id: u.id,
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  isActive: meta.isActive !== undefined ? meta.isActive : true,
  rollNumber: meta.rollNumber || '',
  department: meta.department || 'General',
  tempPassword: meta.tempPassword || null,
  createdAt: u.created_at,
  updatedAt: u.updated_at
});

// Helper: Log activity
const logAdminAction = async (adminId, action, entityType, entityId, metadata = {}) => {
  try {
    await supabase.from('activity_logs').insert({
      user_id: adminId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata
    });
  } catch (err) {
    console.warn('[Admin Log Warning]', err.message);
  }
};

// Helper: Fetch student metadata from activity_logs
const getStudentsMetadata = async (studentIds) => {
  try {
    const { data: logs } = await supabase
      .from('activity_logs')
      .select('entity_id, action, metadata, created_at')
      .in('entity_id', studentIds)
      .in('action', ['student_status_changed', 'student_updated', 'temp_credential_generated'])
      .order('created_at', { ascending: true });

    const metaMap = {};
    (logs || []).forEach((log) => {
      const id = log.entity_id;
      if (!metaMap[id]) metaMap[id] = { isActive: true, rollNumber: '', department: 'General', tempPassword: null };

      if (log.action === 'student_status_changed' && log.metadata) {
        metaMap[id].isActive = log.metadata.isActive;
      }
      if (log.action === 'student_updated' && log.metadata) {
        if (log.metadata.rollNumber) metaMap[id].rollNumber = log.metadata.rollNumber;
        if (log.metadata.department) metaMap[id].department = log.metadata.department;
      }
      if (log.action === 'temp_credential_generated' && log.metadata) {
        metaMap[id].tempPassword = log.metadata.tempPassword;
      }
    });

    return metaMap;
  } catch (err) {
    return {};
  }
};

// =============================================================================
// 1. DASHBOARD & ANALYTICS
// =============================================================================

const getAdminDashboard = async (req, res, next) => {
  try {
    const [
      testsRes,
      studentsRes,
      resultsRes,
      activeAttemptsRes,
      recentResultsRes,
      passedRes,
      activityLogsRes
    ] = await Promise.all([
      supabase.from('tests').select('id, title, category, is_active, created_at', { count: 'exact' }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('results').select('id, score, total_marks, passed, time_taken_seconds, created_at', { count: 'exact' }),
      supabase.from('attempts').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
      supabase
        .from('results')
        .select('*, profiles!student_id(name, email), tests!test_id(title, category)')
        .order('created_at', { ascending: false })
        .limit(6),
      supabase.from('results').select('id', { count: 'exact', head: true }).eq('passed', true),
      supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8)
    ]);

    const totalTests = testsRes.count || 0;
    const totalStudents = studentsRes.count || 0;
    const totalSubmissions = resultsRes.count || 0;
    const passedCount = passedRes.count || 0;
    const liveTestTakers = activeAttemptsRes.count || 0;

    const passRate = totalSubmissions > 0 ? Math.round((passedCount / totalSubmissions) * 100) : 0;

    // Calculate average score percentage
    const allResults = resultsRes.data || [];
    const avgScore =
      allResults.length > 0
        ? Math.round(
            allResults.reduce((sum, r) => sum + (r.score / (r.total_marks || 1)) * 100, 0) /
              allResults.length
          )
        : 0;

    // Category distribution from real tests
    const categoryCounts = {};
    (testsRes.data || []).forEach((t) => {
      const cat = t.category || 'General';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const categoryBreakdown = Object.keys(categoryCounts).map((cat) => ({
      name: cat,
      count: categoryCounts[cat]
    }));

    // Format recent submissions
    const recentSubmissions = (recentResultsRes.data || []).map((r) => ({
      _id: r.id,
      score: r.score,
      totalMarks: r.total_marks,
      passed: r.passed,
      timeTakenSeconds: r.time_taken_seconds,
      createdAt: r.created_at,
      student: r.profiles ? { name: r.profiles.name, email: r.profiles.email } : { name: 'Unknown' },
      test: r.tests ? { title: r.tests.title, category: r.tests.category } : { title: 'Assessment' }
    }));

    return res.status(200).json({
      success: true,
      stats: {
        totalTests,
        totalStudents,
        totalSubmissions,
        passRate,
        avgScore,
        liveTestTakers,
        recentSubmissions,
        categoryBreakdown,
        recentActivity: activityLogsRes.data || []
      }
    });
  } catch (err) {
    next(err);
  }
};

const getAdminAnalytics = async (req, res, next) => {
  try {
    const [resultsRes, testsRes, studentsRes] = await Promise.all([
      supabase
        .from('results')
        .select('*, profiles!student_id(name, email), tests!test_id(title, category)')
        .order('created_at', { ascending: false }),
      supabase.from('tests').select('id, title, category, total_marks, pass_marks'),
      supabase.from('profiles').select('id, name, email').eq('role', 'student')
    ]);

    const results = resultsRes.data || [];
    const tests = testsRes.data || [];
    const students = studentsRes.data || [];

    // Score distribution buckets (0-20, 21-40, 41-60, 61-80, 81-100)
    const distribution = [
      { range: '0-20%', count: 0 },
      { range: '21-40%', count: 0 },
      { range: '41-60%', count: 0 },
      { range: '61-80%', count: 0 },
      { range: '81-100%', count: 0 }
    ];

    results.forEach((r) => {
      const pct = Math.round((r.score / (r.total_marks || 1)) * 100);
      if (pct <= 20) distribution[0].count++;
      else if (pct <= 40) distribution[1].count++;
      else if (pct <= 60) distribution[2].count++;
      else if (pct <= 80) distribution[3].count++;
      else distribution[4].count++;
    });

    // Test-wise performance analytics
    const testAnalytics = tests.map((t) => {
      const testSubs = results.filter((r) => r.test_id === t.id);
      const subCount = testSubs.length;
      const passedSubs = testSubs.filter((r) => r.passed).length;
      const avgTestScore =
        subCount > 0
          ? Math.round(testSubs.reduce((acc, curr) => acc + curr.score, 0) / subCount)
          : 0;

      return {
        id: t.id,
        title: t.title,
        category: t.category,
        totalMarks: t.total_marks,
        submissions: subCount,
        passRate: subCount > 0 ? Math.round((passedSubs / subCount) * 100) : 0,
        averageScore: avgTestScore
      };
    });

    // Top performers calculation
    const studentPerformance = {};
    results.forEach((r) => {
      const sid = r.student_id;
      if (!studentPerformance[sid]) {
        studentPerformance[sid] = {
          id: sid,
          name: r.profiles?.name || 'Student',
          email: r.profiles?.email || '',
          testsTaken: 0,
          totalScore: 0,
          totalMarks: 0,
          passedCount: 0
        };
      }
      studentPerformance[sid].testsTaken++;
      studentPerformance[sid].totalScore += r.score;
      studentPerformance[sid].totalMarks += r.total_marks;
      if (r.passed) studentPerformance[sid].passedCount++;
    });

    const leaderboard = Object.values(studentPerformance)
      .map((sp) => ({
        ...sp,
        avgPercentage:
          sp.totalMarks > 0 ? Math.round((sp.totalScore / sp.totalMarks) * 100) : 0
      }))
      .sort((a, b) => b.avgPercentage - a.avgPercentage);

    return res.status(200).json({
      success: true,
      analytics: {
        scoreDistribution: distribution,
        testAnalytics,
        topPerformers: leaderboard.slice(0, 10),
        totalEvaluated: results.length,
        studentCount: students.length
      }
    });
  } catch (err) {
    next(err);
  }
};

// =============================================================================
// 2. STUDENT MANAGEMENT (CRUD, Status, Temp Passwords, Bulk Import)
// =============================================================================

const getStudents = async (req, res, next) => {
  try {
    const { search, status, department } = req.query;

    let query = supabase
      .from('profiles')
      .select('id, name, email, role, created_at, updated_at')
      .eq('role', 'student')
      .order('created_at', { ascending: false });

    if (search) {
      const term = `%${search.trim()}%`;
      query = query.or(`name.ilike.${term},email.ilike.${term}`);
    }

    const { data: students, error } = await query;
    if (error) return next(new Error(error.message));

    const studentIds = (students || []).map((s) => s.id);
    const metaMap = await getStudentsMetadata(studentIds);

    let formatted = (students || []).map((s) => formatStudent(s, metaMap[s.id]));

    if (status) {
      const isActiveFilter = status.toLowerCase() === 'active';
      formatted = formatted.filter((s) => s.isActive === isActiveFilter);
    }

    if (department && department !== 'ALL') {
      formatted = formatted.filter((s) => s.department === department);
    }

    return res.status(200).json({
      success: true,
      count: formatted.length,
      students: formatted
    });
  } catch (err) {
    next(err);
  }
};

const createStudent = async (req, res, next) => {
  try {
    const { name, email, password, rollNumber, department } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    // Default password or custom
    const initialPassword = password && password.length >= 6 ? password : `Campus@${Math.floor(1000 + Math.random() * 9000)}`;
    const password_hash = await bcrypt.hash(initialPassword, 10);

    const { data: newStudent, error } = await supabase
      .from('profiles')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password_hash,
        role: 'student'
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ success: false, message: 'A student with this campus email already exists.' });
      }
      return next(new Error(error.message));
    }

    // Store metadata
    await logAdminAction(req.user.id, 'student_updated', 'profiles', newStudent.id, {
      rollNumber: rollNumber || '',
      department: department || 'General'
    });

    await logAdminAction(req.user.id, 'temp_credential_generated', 'profiles', newStudent.id, {
      tempPassword: initialPassword
    });

    // Send welcome notification
    await supabase.from('notifications').insert({
      user_id: newStudent.id,
      title: 'Welcome to CampusTest',
      message: `Your student profile has been created. Your temporary initial password is: ${initialPassword}`
    });

    return res.status(201).json({
      success: true,
      message: 'Student created successfully.',
      student: formatStudent(newStudent, {
        rollNumber,
        department,
        tempPassword: initialPassword,
        isActive: true
      }),
      credentials: {
        email: newStudent.email,
        temporaryPassword: initialPassword
      }
    });
  } catch (err) {
    next(err);
  }
};

const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, rollNumber, department } = req.body;

    const updates = {};
    if (name) updates.name = name.trim();
    if (email) updates.email = email.toLowerCase().trim();

    const { data: updated, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .eq('role', 'student')
      .select()
      .single();

    if (error) return next(new Error(error.message));
    if (!updated) return res.status(404).json({ success: false, message: 'Student not found.' });

    if (rollNumber !== undefined || department !== undefined) {
      await logAdminAction(req.user.id, 'student_updated', 'profiles', id, {
        rollNumber: rollNumber || '',
        department: department || 'General'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Student updated successfully.',
      student: formatStudent(updated, { rollNumber, department })
    });
  } catch (err) {
    next(err);
  }
};

const toggleStudentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const { data: student, error } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('id', id)
      .eq('role', 'student')
      .single();

    if (error || !student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const newStatus = isActive === undefined ? false : !!isActive;

    await logAdminAction(req.user.id, 'student_status_changed', 'profiles', id, {
      isActive: newStatus,
      updatedBy: req.user.email
    });

    return res.status(200).json({
      success: true,
      message: `Student account ${newStatus ? 'activated' : 'deactivated'} successfully.`,
      isActive: newStatus
    });
  } catch (err) {
    next(err);
  }
};

const generateTempCredentials = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: student, error } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('id', id)
      .eq('role', 'student')
      .single();

    if (error || !student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const tempPassword = `Temp@${crypto.randomBytes(3).toString('hex').toUpperCase()}!`;
    const password_hash = await bcrypt.hash(tempPassword, 10);

    await supabase
      .from('profiles')
      .update({ password_hash, updated_at: new Date().toISOString() })
      .eq('id', id);

    await logAdminAction(req.user.id, 'temp_credential_generated', 'profiles', id, {
      tempPassword
    });

    await supabase.from('notifications').insert({
      user_id: id,
      title: 'Temporary Password Issued',
      message: `An administrator generated a new temporary password for your account: ${tempPassword}. Please update it after signing in.`
    });

    return res.status(200).json({
      success: true,
      message: 'Temporary credentials generated successfully.',
      credentials: {
        studentName: student.name,
        email: student.email,
        temporaryPassword: tempPassword
      }
    });
  } catch (err) {
    next(err);
  }
};

const resetStudentPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);

    const { error } = await supabase
      .from('profiles')
      .update({ password_hash, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('role', 'student');

    if (error) return next(new Error(error.message));

    await logAdminAction(req.user.id, 'admin_reset_student_password', 'profiles', id);

    return res.status(200).json({
      success: true,
      message: 'Student password has been reset successfully.'
    });
  } catch (err) {
    next(err);
  }
};

const bulkImportStudents = async (req, res, next) => {
  try {
    const { students } = req.body; // Array of { name, email, rollNumber, department, password }

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide a valid array of student records.' });
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: []
    };

    const createdList = [];

    for (let i = 0; i < students.length; i++) {
      const row = students[i];
      const name = (row.name || '').trim();
      const email = (row.email || '').toLowerCase().trim();

      if (!name || !email || !email.includes('@')) {
        results.skipped++;
        results.errors.push(`Row ${i + 1}: Invalid name or email.`);
        continue;
      }

      // Check if email already exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existing) {
        results.skipped++;
        results.errors.push(`Row ${i + 1}: Email "${email}" already registered.`);
        continue;
      }

      const tempPwd = row.password && row.password.length >= 6 ? row.password : `Campus@${Math.floor(1000 + Math.random() * 9000)}`;
      const password_hash = await bcrypt.hash(tempPwd, 10);

      const { data: inserted, error } = await supabase
        .from('profiles')
        .insert({
          name,
          email,
          password_hash,
          role: 'student'
        })
        .select()
        .single();

      if (error) {
        results.skipped++;
        results.errors.push(`Row ${i + 1}: Database error (${error.message})`);
        continue;
      }

      // Metadata
      await logAdminAction(req.user.id, 'student_updated', 'profiles', inserted.id, {
        rollNumber: row.rollNumber || '',
        department: row.department || 'General'
      });

      await logAdminAction(req.user.id, 'temp_credential_generated', 'profiles', inserted.id, {
        tempPassword: tempPwd
      });

      results.imported++;
      createdList.push({
        name: inserted.name,
        email: inserted.email,
        temporaryPassword: tempPwd
      });
    }

    await logAdminAction(req.user.id, 'bulk_students_imported', 'profiles', null, {
      totalUploaded: students.length,
      importedCount: results.imported,
      skippedCount: results.skipped
    });

    return res.status(200).json({
      success: true,
      message: `Bulk import completed: ${results.imported} imported, ${results.skipped} skipped.`,
      results,
      createdList
    });
  } catch (err) {
    next(err);
  }
};

// =============================================================================
// 3. QUESTION BANK & QUESTIONS
// =============================================================================

const getQuestionBank = async (req, res, next) => {
  try {
    const { category, type, search } = req.query;

    // Fetch tests to extract questions from test.questions JSONB
    const { data: tests, error } = await supabase
      .from('tests')
      .select('id, title, category, questions');

    if (error) return next(new Error(error.message));

    let allQuestions = [];
    (tests || []).forEach((t) => {
      const qList = Array.isArray(t.questions) ? t.questions : [];
      qList.forEach((q, idx) => {
        allQuestions.push({
          id: `${t.id}-${idx}`,
          testId: t.id,
          testTitle: t.title,
          category: t.category,
          questionText: q.questionText || '',
          options: q.options || [],
          correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : 0,
          marks: q.marks || 1,
          type: q.type || 'multiple_choice'
        });
      });
    });

    // Also fetch normalized questions table if any exist
    const { data: normQuestions } = await supabase
      .from('questions')
      .select('*, tests!test_id(title, category)');

    (normQuestions || []).forEach((nq) => {
      allQuestions.push({
        id: nq.id,
        testId: nq.test_id,
        testTitle: nq.tests?.title || 'Standalone Question',
        category: nq.tests?.category || 'General',
        questionText: nq.question_text,
        options: nq.options || [],
        correctAnswer: nq.correct_answer || 0,
        marks: nq.marks || 1,
        type: nq.question_type || 'multiple_choice'
      });
    });

    // Apply filters
    if (category && category !== 'ALL') {
      allQuestions = allQuestions.filter((q) => q.category === category);
    }
    if (type && type !== 'ALL') {
      allQuestions = allQuestions.filter((q) => q.type === type);
    }
    if (search) {
      const s = search.toLowerCase();
      allQuestions = allQuestions.filter((q) => q.questionText.toLowerCase().includes(s));
    }

    return res.status(200).json({
      success: true,
      count: allQuestions.length,
      questions: allQuestions
    });
  } catch (err) {
    next(err);
  }
};

const addQuestionToBank = async (req, res, next) => {
  try {
    const { testId, questionText, options, correctAnswer, marks, questionType } = req.body;

    if (!questionText || !options || options.length < 2) {
      return res.status(400).json({ success: false, message: 'Question text and at least 2 options are required.' });
    }

    if (testId) {
      // Append to the test's questions JSONB
      const { data: test, error: fetchErr } = await supabase
        .from('tests')
        .select('id, questions, total_marks')
        .eq('id', testId)
        .single();

      if (fetchErr || !test) return res.status(404).json({ success: false, message: 'Test not found.' });

      const newQ = {
        questionText: questionText.trim(),
        options: options.map((o) => (typeof o === 'string' ? o.trim() : o)),
        correctAnswer: parseInt(correctAnswer, 10) || 0,
        marks: parseInt(marks, 10) || 1,
        type: questionType || 'multiple_choice'
      };

      const currentQuestions = Array.isArray(test.questions) ? test.questions : [];
      const updatedQuestions = [...currentQuestions, newQ];
      const newTotal = updatedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);

      const { error: updateErr } = await supabase
        .from('tests')
        .update({
          questions: updatedQuestions,
          total_marks: newTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', testId);

      if (updateErr) return next(new Error(updateErr.message));

      return res.status(201).json({
        success: true,
        message: 'Question added to assessment successfully.',
        question: newQ
      });
    }

    // Otherwise insert into normalized questions table
    const { data: inserted, error: normErr } = await supabase
      .from('questions')
      .insert({
        question_text: questionText.trim(),
        options,
        correct_answer: parseInt(correctAnswer, 10) || 0,
        marks: parseInt(marks, 10) || 1,
        question_type: questionType || 'multiple_choice'
      })
      .select()
      .single();

    if (normErr) return next(new Error(normErr.message));

    return res.status(201).json({
      success: true,
      message: 'Question added to Question Bank.',
      question: inserted
    });
  } catch (err) {
    next(err);
  }
};

// =============================================================================
// 4. TEST ASSIGNMENTS & SCHEDULES
// =============================================================================

const getAssignments = async (req, res, next) => {
  try {
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('*, profiles!student_id(id, name, email), tests!test_id(id, title, category, duration_minutes)')
      .order('created_at', { ascending: false });

    if (error) return next(new Error(error.message));

    const formatted = (assignments || []).map((a) => ({
      _id: a.id,
      test: a.tests ? { id: a.tests.id, title: a.tests.title, category: a.tests.category, durationMinutes: a.tests.duration_minutes } : null,
      student: a.profiles ? { id: a.profiles.id, name: a.profiles.name, email: a.profiles.email } : null,
      status: a.status,
      dueDate: a.due_date,
      createdAt: a.created_at
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      assignments: formatted
    });
  } catch (err) {
    next(err);
  }
};

const createAssignment = async (req, res, next) => {
  try {
    const { testId, studentIds, dueDate } = req.body;

    if (!testId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide testId and at least one student.' });
    }

    const assigned = [];
    for (const sid of studentIds) {
      const { data, error } = await supabase
        .from('assignments')
        .upsert(
          {
            test_id: testId,
            student_id: sid,
            assigned_by: req.user.id,
            due_date: dueDate || null,
            status: 'pending'
          },
          { onConflict: 'test_id,student_id' }
        )
        .select();

      if (!error && data) assigned.push(data[0]);

      // Notification to student
      await supabase.from('notifications').insert({
        user_id: sid,
        title: 'New Assessment Assigned',
        message: 'A new examination evaluation has been assigned to your student dashboard.'
      });
    }

    return res.status(201).json({
      success: true,
      message: `Test successfully assigned to ${assigned.length} students.`,
      assignedCount: assigned.length
    });
  } catch (err) {
    next(err);
  }
};

const deleteAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (error) return next(new Error(error.message));

    return res.status(200).json({ success: true, message: 'Assignment revoked successfully.' });
  } catch (err) {
    next(err);
  }
};

// Schedules
const getSchedules = async (req, res, next) => {
  try {
    const { data: tests, error } = await supabase
      .from('tests')
      .select('id, title, category, duration_minutes, is_active, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) return next(new Error(error.message));

    // Also fetch schedule metadata from activity_logs
    const { data: scheduleLogs } = await supabase
      .from('activity_logs')
      .select('entity_id, metadata, created_at')
      .eq('action', 'test_scheduled')
      .order('created_at', { ascending: true });

    const schedMap = {};
    (scheduleLogs || []).forEach((l) => {
      schedMap[l.entity_id] = l.metadata;
    });

    const schedules = (tests || []).map((t) => {
      const meta = schedMap[t.id] || {};
      return {
        id: t.id,
        testId: t.id,
        testTitle: t.title,
        category: t.category,
        durationMinutes: t.duration_minutes,
        isActive: t.is_active,
        startTime: meta.startTime || t.created_at,
        endTime: meta.endTime || null,
        autoActivate: meta.autoActivate !== undefined ? meta.autoActivate : true
      };
    });

    return res.status(200).json({
      success: true,
      count: schedules.length,
      schedules
    });
  } catch (err) {
    next(err);
  }
};

const updateSchedule = async (req, res, next) => {
  try {
    const { testId, startTime, endTime, autoActivate } = req.body;

    if (!testId) return res.status(400).json({ success: false, message: 'Test ID is required.' });

    await logAdminAction(req.user.id, 'test_scheduled', 'tests', testId, {
      startTime,
      endTime,
      autoActivate: !!autoActivate
    });

    return res.status(200).json({
      success: true,
      message: 'Examination schedule updated successfully.'
    });
  } catch (err) {
    next(err);
  }
};

// =============================================================================
// 5. LIVE MONITORING
// =============================================================================

const getLiveMonitoring = async (req, res, next) => {
  try {
    // Active attempts in progress
    const { data: activeAttempts, error } = await supabase
      .from('attempts')
      .select('*, profiles!student_id(id, name, email), tests!test_id(id, title, category, duration_minutes)')
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false });

    if (error) return next(new Error(error.message));

    const activeSessions = (activeAttempts || []).map((att) => {
      const started = new Date(att.started_at);
      const elapsedSeconds = Math.max(0, Math.floor((Date.now() - started.getTime()) / 1000));
      const totalSeconds = (att.tests?.duration_minutes || 30) * 60;
      const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

      return {
        attemptId: att.id,
        student: att.profiles ? { id: att.profiles.id, name: att.profiles.name, email: att.profiles.email } : { name: 'Unknown' },
        test: att.tests ? { id: att.tests.id, title: att.tests.title, category: att.tests.category, durationMinutes: att.tests.duration_minutes } : { title: 'Exam' },
        startedAt: att.started_at,
        elapsedSeconds,
        remainingSeconds,
        progressPercent: Math.min(100, Math.round((elapsedSeconds / totalSeconds) * 100)),
        status: remainingSeconds === 0 ? 'overdue' : 'active'
      };
    });

    return res.status(200).json({
      success: true,
      count: activeSessions.length,
      activeSessions
    });
  } catch (err) {
    next(err);
  }
};

const forceSubmitAttempt = async (req, res, next) => {
  try {
    const { attemptId } = req.params;

    const { data: attempt, error: fetchErr } = await supabase
      .from('attempts')
      .select('*')
      .eq('id', attemptId)
      .single();

    if (fetchErr || !attempt) {
      return res.status(404).json({ success: false, message: 'Active examination session not found.' });
    }

    // Complete attempt
    await supabase
      .from('attempts')
      .update({
        status: 'submitted',
        completed_at: new Date().toISOString()
      })
      .eq('id', attemptId);

    await logAdminAction(req.user.id, 'admin_force_submit', 'attempts', attemptId, {
      studentId: attempt.student_id,
      testId: attempt.test_id
    });

    return res.status(200).json({
      success: true,
      message: 'Student session was successfully submitted and terminated.'
    });
  } catch (err) {
    next(err);
  }
};

// =============================================================================
// 6. RESULTS & LEADERBOARD
// =============================================================================

const getAdminResults = async (req, res, next) => {
  try {
    const { testId, search, passed } = req.query;

    let query = supabase
      .from('results')
      .select('*, profiles!student_id(id, name, email), tests!test_id(id, title, category, duration_minutes)')
      .order('created_at', { ascending: false });

    if (testId && testId !== 'ALL') {
      query = query.eq('test_id', testId);
    }
    if (passed !== undefined && passed !== 'ALL') {
      query = query.eq('passed', passed === 'true');
    }

    const { data: results, error } = await query;
    if (error) return next(new Error(error.message));

    let formatted = (results || []).map((r) => ({
      _id: r.id,
      test: r.tests ? { id: r.tests.id, title: r.tests.title, category: r.tests.category } : null,
      student: r.profiles ? { id: r.profiles.id, name: r.profiles.name, email: r.profiles.email } : null,
      score: r.score,
      totalMarks: r.total_marks,
      passed: r.passed,
      percentage: Math.round((r.score / (r.total_marks || 1)) * 100),
      timeTakenSeconds: r.time_taken_seconds,
      answers: r.answers || [],
      createdAt: r.created_at
    }));

    if (search) {
      const s = search.toLowerCase();
      formatted = formatted.filter(
        (r) =>
          r.student?.name?.toLowerCase().includes(s) ||
          r.student?.email?.toLowerCase().includes(s) ||
          r.test?.title?.toLowerCase().includes(s)
      );
    }

    return res.status(200).json({
      success: true,
      count: formatted.length,
      results: formatted
    });
  } catch (err) {
    next(err);
  }
};

const getLeaderboard = async (req, res, next) => {
  try {
    const { testId } = req.query;

    let query = supabase
      .from('results')
      .select('*, profiles!student_id(id, name, email), tests!test_id(id, title, category)');

    if (testId && testId !== 'ALL') {
      query = query.eq('test_id', testId);
    }

    const { data: results, error } = await query;
    if (error) return next(new Error(error.message));

    const studentMap = {};
    (results || []).forEach((r) => {
      const sid = r.student_id;
      if (!studentMap[sid]) {
        studentMap[sid] = {
          studentId: sid,
          name: r.profiles?.name || 'Student',
          email: r.profiles?.email || '',
          testsCompleted: 0,
          totalScore: 0,
          maxPossibleMarks: 0,
          passedCount: 0,
          totalTimeSpent: 0
        };
      }
      studentMap[sid].testsCompleted++;
      studentMap[sid].totalScore += r.score;
      studentMap[sid].maxPossibleMarks += r.total_marks;
      studentMap[sid].totalTimeSpent += r.time_taken_seconds;
      if (r.passed) studentMap[sid].passedCount++;
    });

    const rankings = Object.values(studentMap)
      .map((s) => ({
        ...s,
        avgScorePercent:
          s.maxPossibleMarks > 0 ? Math.round((s.totalScore / s.maxPossibleMarks) * 100) : 0,
        passRate:
          s.testsCompleted > 0 ? Math.round((s.passedCount / s.testsCompleted) * 100) : 0
      }))
      .sort((a, b) => {
        if (b.avgScorePercent !== a.avgScorePercent) return b.avgScorePercent - a.avgScorePercent;
        return b.totalScore - a.totalScore;
      })
      .map((item, idx) => ({
        rank: idx + 1,
        ...item
      }));

    return res.status(200).json({
      success: true,
      count: rankings.length,
      rankings
    });
  } catch (err) {
    next(err);
  }
};

// =============================================================================
// 7. NOTIFICATIONS & BROADCASTS
// =============================================================================

const getAdminNotifications = async (req, res, next) => {
  try {
    const { data: notifs, error } = await supabase
      .from('notifications')
      .select('*, profiles!user_id(name, email, role)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return next(new Error(error.message));

    const formatted = (notifs || []).map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      isRead: n.is_read,
      recipient: n.profiles ? { name: n.profiles.name, email: n.profiles.email, role: n.profiles.role } : { name: 'All' },
      createdAt: n.created_at
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      notifications: formatted
    });
  } catch (err) {
    next(err);
  }
};

const broadcastNotification = async (req, res, next) => {
  try {
    const { title, message, target, studentId } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required.' });
    }

    if (target === 'student' && studentId) {
      // Send to single student
      await supabase.from('notifications').insert({
        user_id: studentId,
        title: title.trim(),
        message: message.trim()
      });

      return res.status(201).json({ success: true, message: 'Notification delivered to student.' });
    }

    // Broadcast to all students
    const { data: students } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'student');

    if (students && students.length > 0) {
      const inserts = students.map((s) => ({
        user_id: s.id,
        title: title.trim(),
        message: message.trim()
      }));

      await supabase.from('notifications').insert(inserts);
    }

    await logAdminAction(req.user.id, 'broadcast_notification_sent', 'notifications', null, {
      title,
      recipientCount: students?.length || 0
    });

    return res.status(201).json({
      success: true,
      message: `Notification broadcasted to ${students?.length || 0} students.`
    });
  } catch (err) {
    next(err);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) return next(new Error(error.message));

    return res.status(200).json({ success: true, message: 'Notification removed.' });
  } catch (err) {
    next(err);
  }
};

// =============================================================================
// 8. SETTINGS
// =============================================================================

const getAdminSettings = async (req, res, next) => {
  try {
    const { data: settingsLog } = await supabase
      .from('activity_logs')
      .select('metadata')
      .eq('action', 'platform_settings_updated')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const defaultSettings = {
      institutionName: 'CampusTech Institute of Technology',
      campusCode: 'CTECH-2026',
      contactEmail: 'admin@campus.edu',
      passPercentageThreshold: 50,
      defaultTestDuration: 30,
      enableStrictProctoring: true,
      allowLateSubmissions: false,
      databaseStatus: 'Connected (PostgreSQL / Supabase)',
      systemVersion: 'v2.4.0 (Enterprise SaaS)'
    };

    const currentSettings = settingsLog?.metadata ? { ...defaultSettings, ...settingsLog.metadata } : defaultSettings;

    return res.status(200).json({
      success: true,
      settings: currentSettings
    });
  } catch (err) {
    next(err);
  }
};

const updateAdminSettings = async (req, res, next) => {
  try {
    const settings = req.body;

    await logAdminAction(req.user.id, 'platform_settings_updated', 'system', null, settings);

    return res.status(200).json({
      success: true,
      message: 'Institution platform settings saved successfully.',
      settings
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  // Dashboard & Analytics
  getAdminDashboard,
  getAdminAnalytics,

  // Student Management
  getStudents,
  createStudent,
  updateStudent,
  toggleStudentStatus,
  generateTempCredentials,
  resetStudentPassword,
  bulkImportStudents,

  // Question Bank
  getQuestionBank,
  addQuestionToBank,

  // Test Assignments & Schedules
  getAssignments,
  createAssignment,
  deleteAssignment,
  getSchedules,
  updateSchedule,

  // Live Monitoring
  getLiveMonitoring,
  forceSubmitAttempt,

  // Results & Leaderboard
  getAdminResults,
  getLeaderboard,

  // Notifications
  getAdminNotifications,
  broadcastNotification,
  deleteNotification,

  // Settings
  getAdminSettings,
  updateAdminSettings
};
