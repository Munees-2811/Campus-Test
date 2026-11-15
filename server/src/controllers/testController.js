const supabase = require('../config/supabaseClient');

// ─── Formatters ───────────────────────────────────────────────────────────────

const formatTest = (t) => ({
  _id: t.id,
  title: t.title,
  description: t.description,
  category: t.category,
  durationMinutes: t.duration_minutes,
  totalMarks: t.total_marks,
  passMarks: t.pass_marks,
  questions: t.questions,
  isActive: t.is_active,
  createdBy: t.created_by_profile || t.created_by,
  createdAt: t.created_at,
  updatedAt: t.updated_at,
});

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

const stripAnswers = (questions) =>
  questions.map((q) => ({
    questionText: q.questionText,
    options: q.options,
    marks: q.marks,
    // correctAnswer intentionally omitted
  }));

// ─── getTests ─────────────────────────────────────────────────────────────────

const getTests = async (req, res, next) => {
  try {
    const isStudent = req.user.role === 'student';

    if (!isStudent) {
      // Admin: fetch all tests with creator info
      const { data, error } = await supabase
        .from('tests')
        .select('*, profiles!created_by(id, name, email)')
        .order('created_at', { ascending: false });

      if (error) return next(new Error(error.message));

      const tests = (data || []).map((t) => {
        const formatted = formatTest(t);
        // Embed creator profile
        if (t.profiles) {
          formatted.createdBy = { _id: t.profiles.id, name: t.profiles.name, email: t.profiles.email };
        }
        return formatted;
      });

      return res.json({ success: true, count: tests.length, tests });
    }

    // Student: fetch only active tests
    const { data: testsData, error: testsError } = await supabase
      .from('tests')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (testsError) return next(new Error(testsError.message));

    // Fetch student's existing submissions
    const { data: submissionsData, error: submissionsError } = await supabase
      .from('results')
      .select('id, test_id, score, total_marks, passed, created_at')
      .eq('student_id', req.user.id);

    if (submissionsError) return next(new Error(submissionsError.message));

    const submissionsMap = {};
    (submissionsData || []).forEach((r) => {
      submissionsMap[r.test_id] = r;
    });

    const tests = (testsData || []).map((t) => {
      const formatted = formatTest(t);
      formatted.questions = stripAnswers(t.questions || []);
      const sub = submissionsMap[t.id];
      formatted.alreadySubmitted = !!sub;
      if (sub) {
        formatted.previousResult = {
          _id: sub.id,
          score: sub.score,
          totalMarks: sub.total_marks,
          passed: sub.passed,
          createdAt: sub.created_at,
        };
      }
      return formatted;
    });

    return res.json({ success: true, count: tests.length, tests });
  } catch (err) {
    next(err);
  }
};

// ─── getTestById ──────────────────────────────────────────────────────────────

const getTestById = async (req, res, next) => {
  try {
    const isStudent = req.user.role === 'student';

    const { data, error } = await supabase
      .from('tests')
      .select('*, profiles!created_by(id, name, email)')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    const test = formatTest(data);
    if (data.profiles) {
      test.createdBy = { _id: data.profiles.id, name: data.profiles.name, email: data.profiles.email };
    }

    let previousResult = null;

    if (isStudent) {
      test.questions = stripAnswers(data.questions || []);

      const { data: resultData, error: resultError } = await supabase
        .from('results')
        .select('id, score, total_marks, passed, time_taken_seconds, created_at')
        .eq('test_id', req.params.id)
        .eq('student_id', req.user.id)
        .maybeSingle();

      if (resultError) return next(new Error(resultError.message));

      if (resultData) {
        previousResult = {
          _id: resultData.id,
          score: resultData.score,
          totalMarks: resultData.total_marks,
          passed: resultData.passed,
          timeTakenSeconds: resultData.time_taken_seconds,
          createdAt: resultData.created_at,
        };
      }
    }

    return res.json({ success: true, test, previousResult });
  } catch (err) {
    next(err);
  }
};

// ─── createTest ───────────────────────────────────────────────────────────────

const createTest = async (req, res, next) => {
  try {
    const { title, description, category, durationMinutes, questions, isActive } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Questions array is required' });
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText) {
        return res.status(400).json({ success: false, message: `Question ${i + 1} is missing questionText` });
      }
      if (!Array.isArray(q.options) || q.options.length < 2) {
        return res.status(400).json({ success: false, message: `Question ${i + 1} must have at least 2 options` });
      }
      if (q.correctAnswer === undefined || q.correctAnswer === null) {
        return res.status(400).json({ success: false, message: `Question ${i + 1} is missing correctAnswer` });
      }
    }

    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    const passMarks = Math.ceil(totalMarks * 0.4);

    const { data, error } = await supabase
      .from('tests')
      .insert({
        title,
        description: description || '',
        category: category || 'General',
        duration_minutes: Number(durationMinutes) || 30,
        questions,
        total_marks: totalMarks,
        pass_marks: passMarks,
        is_active: isActive !== undefined ? isActive : true,
        created_by: req.user.id,
      })
      .select()
      .single();

    if (error) return next(new Error(error.message));

    return res.status(201).json({ success: true, message: 'Test created successfully', test: formatTest(data) });
  } catch (err) {
    next(err);
  }
};

// ─── updateTest ───────────────────────────────────────────────────────────────

const updateTest = async (req, res, next) => {
  try {
    // Verify test exists
    const { data: existing, error: fetchError } = await supabase
      .from('tests')
      .select('id, questions, total_marks, pass_marks')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    const { title, description, category, durationMinutes, questions, isActive } = req.body;
    const updateObj = {};

    if (title !== undefined) updateObj.title = title;
    if (description !== undefined) updateObj.description = description;
    if (category !== undefined) updateObj.category = category;
    if (durationMinutes !== undefined) updateObj.duration_minutes = Number(durationMinutes);
    if (isActive !== undefined) updateObj.is_active = isActive;

    if (questions !== undefined) {
      updateObj.questions = questions;
      updateObj.total_marks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
      updateObj.pass_marks = Math.ceil(updateObj.total_marks * 0.4);
    }

    updateObj.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('tests')
      .update(updateObj)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return next(new Error(error.message));

    return res.json({ success: true, message: 'Test updated successfully', test: formatTest(data) });
  } catch (err) {
    next(err);
  }
};

// ─── deleteTest ───────────────────────────────────────────────────────────────

const deleteTest = async (req, res, next) => {
  try {
    // Delete related results first (explicit, though ON DELETE CASCADE handles it)
    const { error: resultsError } = await supabase
      .from('results')
      .delete()
      .eq('test_id', req.params.id);

    if (resultsError) return next(new Error(resultsError.message));

    const { error } = await supabase
      .from('tests')
      .delete()
      .eq('id', req.params.id);

    if (error) return next(new Error(error.message));

    return res.json({ success: true, message: 'Test deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── submitTest ───────────────────────────────────────────────────────────────

const submitTest = async (req, res, next) => {
  try {
    const { answers, timeTakenSeconds } = req.body;

    // Fetch full test including correctAnswer
    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (testError || !test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    if (!test.is_active) {
      return res.status(400).json({ success: false, message: 'This test is not active' });
    }

    // Check for existing submission
    const { data: existing } = await supabase
      .from('results')
      .select('id')
      .eq('test_id', req.params.id)
      .eq('student_id', req.user.id)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already submitted this test.' });
    }

    // Evaluate answers
    const questions = test.questions || [];
    let score = 0;
    const evaluatedAnswers = (answers || []).map((a) => {
      const question = questions[a.questionIndex];
      const isCorrect = question ? question.correctAnswer === a.selectedOption : false;
      if (isCorrect) score += question.marks || 1;
      return { questionIndex: a.questionIndex, selectedOption: a.selectedOption, isCorrect };
    });

    const passed = score >= test.pass_marks;

    const { data: result, error: insertError } = await supabase
      .from('results')
      .insert({
        test_id: req.params.id,
        student_id: req.user.id,
        answers: evaluatedAnswers,
        score,
        total_marks: test.total_marks,
        passed,
        time_taken_seconds: timeTakenSeconds || 0,
      })
      .select()
      .single();

    if (insertError) return next(new Error(insertError.message));

    const formatted = formatResult(result);
    formatted.test = { _id: test.id, title: test.title, category: test.category, totalMarks: test.total_marks, passMarks: test.pass_marks };

    return res.status(201).json({ success: true, message: 'Test submitted successfully', result: formatted });
  } catch (err) {
    next(err);
  }
};

// ─── getMyResults ─────────────────────────────────────────────────────────────

const getMyResults = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('results')
      .select('*, tests(id, title, category, total_marks, pass_marks, duration_minutes)')
      .eq('student_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) return next(new Error(error.message));

    const results = (data || []).map((r) => {
      const formatted = formatResult(r);
      if (r.tests) {
        formatted.test = {
          _id: r.tests.id,
          title: r.tests.title,
          category: r.tests.category,
          totalMarks: r.tests.total_marks,
          passMarks: r.tests.pass_marks,
          durationMinutes: r.tests.duration_minutes,
        };
      }
      return formatted;
    });

    return res.json({ success: true, count: results.length, results });
  } catch (err) {
    next(err);
  }
};

// ─── getTestResultsAdmin ──────────────────────────────────────────────────────

const getTestResultsAdmin = async (req, res, next) => {
  try {
    // Verify test exists
    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('id, title, category, total_marks, pass_marks')
      .eq('id', req.params.id)
      .single();

    if (testError || !test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    const { data, error } = await supabase
      .from('results')
      .select('*, profiles!student_id(id, name, email)')
      .eq('test_id', req.params.id)
      .order('score', { ascending: false });

    if (error) return next(new Error(error.message));

    const results = (data || []).map((r) => {
      const formatted = formatResult(r);
      if (r.profiles) {
        formatted.student = { _id: r.profiles.id, name: r.profiles.name, email: r.profiles.email };
      }
      return formatted;
    });

    return res.json({
      success: true,
      test: { _id: test.id, title: test.title, category: test.category, totalMarks: test.total_marks, passMarks: test.pass_marks },
      count: results.length,
      results,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
  submitTest,
  getMyResults,
  getTestResultsAdmin,
};
