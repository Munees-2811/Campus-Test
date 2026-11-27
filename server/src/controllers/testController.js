const supabase = require('../config/supabaseClient');

// ─── Formatters & Metadata Serialization ─────────────────────────────────────

const parseDescriptionMeta = (descriptionStr) => {
  const defaultMeta = {
    status: 'published',
    negativeMarking: false,
    negativeMarkValue: 0.25,
    randomizeQuestions: false,
    allowRetakes: false,
    maxRetakes: 1,
    releaseResultsImmediately: true,
    releaseDate: null,
    scheduledStartTime: null,
    scheduledEndTime: null,
    targetClass: 'All Batches',
  };

  if (!descriptionStr || typeof descriptionStr !== 'string') {
    return { description: '', meta: defaultMeta };
  }

  const markerIndex = descriptionStr.indexOf('<!--CAMPUSTEST_META:');
  if (markerIndex === -1) {
    return { description: descriptionStr, meta: defaultMeta };
  }

  const cleanDescription = descriptionStr.substring(0, markerIndex).trim();
  const metaStr = descriptionStr.substring(markerIndex + '<!--CAMPUSTEST_META:'.length).replace('-->', '').trim();

  try {
    const meta = JSON.parse(metaStr);
    return {
      description: cleanDescription,
      meta: {
        status: meta.status || 'published',
        negativeMarking: !!meta.negativeMarking,
        negativeMarkValue: Number(meta.negativeMarkValue) || 0.25,
        randomizeQuestions: !!meta.randomizeQuestions,
        allowRetakes: !!meta.allowRetakes,
        maxRetakes: Number(meta.maxRetakes) || 1,
        releaseResultsImmediately: meta.releaseResultsImmediately !== undefined ? !!meta.releaseResultsImmediately : true,
        releaseDate: meta.releaseDate || null,
        scheduledStartTime: meta.scheduledStartTime || null,
        scheduledEndTime: meta.scheduledEndTime || null,
        targetClass: meta.targetClass || 'All Batches',
      }
    };
  } catch (err) {
    return { description: cleanDescription, meta: defaultMeta };
  }
};

const serializeDescriptionMeta = (description, meta = {}) => {
  const baseDesc = (description || '').trim();
  const metaPayload = {
    status: meta.status || 'published',
    negativeMarking: !!meta.negativeMarking,
    negativeMarkValue: Number(meta.negativeMarkValue) || 0.25,
    randomizeQuestions: !!meta.randomizeQuestions,
    allowRetakes: !!meta.allowRetakes,
    maxRetakes: Number(meta.maxRetakes) || 1,
    releaseResultsImmediately: meta.releaseResultsImmediately !== undefined ? !!meta.releaseResultsImmediately : true,
    releaseDate: meta.releaseDate || null,
    scheduledStartTime: meta.scheduledStartTime || null,
    scheduledEndTime: meta.scheduledEndTime || null,
    targetClass: meta.targetClass || 'All Batches',
  };

  return `${baseDesc}\n\n<!--CAMPUSTEST_META:${JSON.stringify(metaPayload)}-->`;
};

const formatTest = (t) => {
  const { description, meta } = parseDescriptionMeta(t.description);

  return {
    _id: t.id,
    id: t.id,
    title: t.title,
    description: description,
    rawDescription: t.description,
    category: t.category,
    durationMinutes: t.duration_minutes,
    totalMarks: t.total_marks,
    passMarks: t.pass_marks,
    questions: t.questions,
    isActive: t.is_active,
    status: meta.status || (t.is_active ? 'published' : 'draft'),
    settings: meta,
    createdBy: t.created_by_profile || t.created_by,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  };
};

const formatResult = (r) => ({
  _id: r.id,
  id: r.id,
  test: r.test || r.test_id,
  student: r.student || r.student_id,
  answers: r.answers,
  score: r.score,
  totalMarks: r.total_marks,
  passed: r.passed,
  timeTakenSeconds: r.time_taken_seconds,
  createdAt: r.created_at,
});

// Strips answer keys before sending questions to students
const stripAnswers = (questions) =>
  (questions || []).map((q, idx) => {
    const stripped = {
      originalIndex: q.originalIndex !== undefined ? q.originalIndex : idx,
      type: q.type || 'multiple_choice',
      title: q.title || '',
      difficulty: q.difficulty || '',
      description: q.description || '',
      inputFormat: q.inputFormat || '',
      outputFormat: q.outputFormat || '',
      constraints: q.constraints || '',
      timeLimit: q.timeLimit || 5,
      memoryLimit: q.memoryLimit || 256,
      allowedLanguages: q.allowedLanguages || [],
      tags: q.tags || [],
      questionText: q.questionText,
      marks: q.marks || 1,
      options: q.options || [],
      starterCode: q.starterCode || '',
      language: q.language || '',
      buggyCode: q.buggyCode || '',
      schemaSql: q.schemaSql || '',
      codeSnippet: q.codeSnippet || '',
      // correctAnswer, correctAnswers, correctNumber, correctSolution, tolerance & explanation stripped
    };

    // Public sample test cases (safe to show student)
    if (Array.isArray(q.sampleTestCases)) {
      stripped.sampleTestCases = q.sampleTestCases.map((stc) => ({
        input: stc.input,
        expectedOutput: stc.expectedOutput,
        explanation: stc.explanation || ''
      }));
    }

    // Only non-hidden test cases returned in testCases
    if (Array.isArray(q.testCases)) {
      stripped.testCases = q.testCases
        .filter((tc) => !tc.isHidden)
        .map((tc) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: false
        }));
    }

    return stripped;
  });

// Fisher-Yates shuffle with question index tracking
const shuffleQuestions = (questions) => {
  const indexed = questions.map((q, idx) => ({ ...q, originalIndex: idx }));
  for (let i = indexed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
  }
  return indexed;
};

// ─── Input Validation ────────────────────────────────────────────────────────

const validateQuestions = (questions) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    return 'Assessment must contain at least 1 question.';
  }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const num = i + 1;
    const type = q.type || 'multiple_choice';

    if (!q.questionText || !q.questionText.trim()) {
      return `Question #${num}: Question text cannot be empty.`;
    }

    if (q.marks === undefined || q.marks === null || Number(q.marks) <= 0) {
      return `Question #${num}: Marks must be a positive number.`;
    }

    // Single choice types
    if (['multiple_choice', 'logical_reasoning', 'quantitative_aptitude', 'verbal_ability', 'aptitude', 'output_prediction', 'technical'].includes(type)) {
      if (!Array.isArray(q.options) || q.options.length < 2) {
        return `Question #${num} (${type}): Must provide at least 2 answer choices.`;
      }
      for (let optIdx = 0; optIdx < q.options.length; optIdx++) {
        if (!q.options[optIdx] || !q.options[optIdx].toString().trim()) {
          return `Question #${num}: Option ${optIdx + 1} cannot be empty.`;
        }
      }
      if (q.correctAnswer === undefined || q.correctAnswer === null || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        return `Question #${num}: Please designate a valid correct answer option.`;
      }
    }

    // Multiple correct answers type
    if (type === 'multiple_answers') {
      if (!Array.isArray(q.options) || q.options.length < 2) {
        return `Question #${num} (Multiple Answers): Must provide at least 2 choices.`;
      }
      if (!Array.isArray(q.correctAnswers) || q.correctAnswers.length === 0) {
        return `Question #${num} (Multiple Answers): Please select at least one correct choice.`;
      }
    }

    // Numerical answer type
    if (type === 'numerical') {
      if (q.correctNumber === undefined || q.correctNumber === null || isNaN(Number(q.correctNumber))) {
        return `Question #${num} (Numerical): Please provide a valid correct numerical value.`;
      }
    }

    // Coding challenge
    if (type === 'coding') {
      const hasCode = typeof q.starterCode === 'object' && q.starterCode !== null
        ? Object.values(q.starterCode).some((v) => typeof v === 'string' && v.trim().length > 0)
        : (typeof q.starterCode === 'string' && q.starterCode.trim().length > 0);
      if (!hasCode) {
        return `Question #${num} (Coding): Please provide starter code.`;
      }
    }

    // Debugging arena
    if (type === 'debugging') {
      if (!q.buggyCode || !q.buggyCode.trim()) {
        return `Question #${num} (Debugging): Please provide buggy code.`;
      }
    }

    // SQL query arena
    if (type === 'sql') {
      if (!q.schemaSql || !q.schemaSql.trim()) {
        return `Question #${num} (SQL): Please supply table schema DDL.`;
      }
    }
  }

  return null;
};

// ─── getTests ───────────────────────────────────────────────────────────────

const getTests = async (req, res, next) => {
  try {
    const isStudent = req.user.role === 'student';

    if (!isStudent) {
      // Admin: fetch all assessments
      const { data, error } = await supabase
        .from('tests')
        .select('*, profiles!created_by(id, name, email)')
        .order('created_at', { ascending: false });

      if (error) return next(new Error(error.message));

      const tests = (data || []).map((t) => {
        const formatted = formatTest(t);
        if (t.profiles) {
          formatted.createdBy = { _id: t.profiles.id, name: t.profiles.name, email: t.profiles.email };
        }
        return formatted;
      });

      return res.json({ success: true, count: tests.length, tests });
    }

    // Student: fetch tests assigned to this student OR open published tests (with no restricted assignments)
    const [myAssignRes, allAssignRes, testsRes] = await Promise.all([
      supabase.from('assignments').select('test_id, due_date, status').eq('student_id', req.user.id),
      supabase.from('assignments').select('test_id'),
      supabase.from('tests').select('*').eq('is_active', true).order('created_at', { ascending: false })
    ]);

    if (myAssignRes.error) return next(new Error(myAssignRes.error.message));
    if (allAssignRes.error) return next(new Error(allAssignRes.error.message));
    if (testsRes.error) return next(new Error(testsRes.error.message));

    const myAssignedSet = new Set((myAssignRes.data || []).map((a) => a.test_id));
    const restrictedSet = new Set((allAssignRes.data || []).map((a) => a.test_id));

    const testsData = (testsRes.data || []).filter(
      (t) => myAssignedSet.has(t.id) || !restrictedSet.has(t.id)
    );

    // Fetch student's submissions
    const { data: submissionsData } = await supabase
      .from('results')
      .select('id, test_id, score, total_marks, passed, created_at')
      .eq('student_id', req.user.id);

    const submissionsMap = {};
    (submissionsData || []).forEach((r) => {
      submissionsMap[r.test_id] = r;
    });

    const tests = (testsData || [])
      .map((t) => {
        const formatted = formatTest(t);
        if (formatted.status === 'draft' || formatted.status === 'archived') {
          return null;
        }

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
      })
      .filter(Boolean);

    return res.json({ success: true, count: tests.length, tests });
  } catch (err) {
    next(err);
  }
};

// ─── getTestById ────────────────────────────────────────────────────────────

const getTestById = async (req, res, next) => {
  try {
    const isStudent = req.user.role === 'student';

    const { data, error } = await supabase
      .from('tests')
      .select('*, profiles!created_by(id, name, email)')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Assessment not found.' });
    }

    const test = formatTest(data);
    if (data.profiles) {
      test.createdBy = { _id: data.profiles.id, name: data.profiles.name, email: data.profiles.email };
    }

    let previousResult = null;
    let existingAttempt = null;

    if (isStudent) {
      // 1. Verify student is assigned to this test (or allow open published test with no restricted assignments)
      const { data: assignment, error: assignErr } = await supabase
        .from('assignments')
        .select('*')
        .eq('test_id', req.params.id)
        .eq('student_id', req.user.id)
        .maybeSingle();

      if (assignErr) return next(new Error(assignErr.message));

      if (!assignment) {
        const { count: anyAssignCount, error: countErr } = await supabase
          .from('assignments')
          .select('id', { count: 'exact', head: true })
          .eq('test_id', req.params.id);

        if (countErr) return next(new Error(countErr.message));

        if ((anyAssignCount || 0) > 0 || !data.is_active) {
          return res.status(403).json({
            success: false,
            message: 'You have not been assigned to this assessment. Please contact your instructor.'
          });
        }
      }

      // 2. Check draft/archived status
      if (test.status === 'draft' || test.status === 'archived') {
        return res.status(403).json({ success: false, message: 'This assessment is currently unavailable.' });
      }

      // 3. Check scheduling window
      const now = new Date();
      if (test.settings?.scheduledStartTime) {
        const start = new Date(test.settings.scheduledStartTime);
        if (now < start) {
          return res.status(403).json({
            success: false,
            message: `This assessment opens on ${start.toLocaleString()}. Please return at the scheduled time.`
          });
        }
      }
      if (test.settings?.scheduledEndTime) {
        const end = new Date(test.settings.scheduledEndTime);
        if (now > end) {
          return res.status(403).json({
            success: false,
            message: `This assessment window closed on ${end.toLocaleString()}.`
          });
        }
      }

      // 4. Fetch or resume attempt
      const { data: attempt } = await supabase
        .from('attempts')
        .select('*')
        .eq('test_id', req.params.id)
        .eq('student_id', req.user.id)
        .eq('status', 'in_progress')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (attempt) {
        existingAttempt = attempt;
        // Fetch saved question-level answers for this attempt
        const { data: savedSubmissions } = await supabase
          .from('submissions')
          .select('question_index, selected_option, submitted_code')
          .eq('attempt_id', attempt.id);

        existingAttempt.savedAnswers = savedSubmissions || [];
      }

      // 5. Check completed results
      const { data: resultData } = await supabase
        .from('results')
        .select('id, score, total_marks, passed, time_taken_seconds, created_at, answers')
        .eq('test_id', req.params.id)
        .eq('student_id', req.user.id)
        .maybeSingle();

      if (resultData) {
        const releaseImmediately = test.settings?.releaseResultsImmediately !== false;
        let resultsReleased = releaseImmediately;

        if (!releaseImmediately && test.settings?.releaseDate) {
          resultsReleased = new Date() >= new Date(test.settings.releaseDate);
        }

        previousResult = {
          _id: resultData.id,
          id: resultData.id,
          score: resultsReleased ? resultData.score : null,
          totalMarks: resultData.total_marks,
          passed: resultsReleased ? resultData.passed : null,
          timeTakenSeconds: resultData.time_taken_seconds,
          createdAt: resultData.created_at,
          resultsReleased,
          releaseDate: test.settings?.releaseDate || null
        };
      }

      // 6. Strip answers and optionally randomize questions
      let processedQuestions = (data.questions || []).map((q, idx) => ({ ...q, originalIndex: idx }));
      if (test.settings?.randomizeQuestions) {
        processedQuestions = shuffleQuestions(processedQuestions);
      }

      test.questions = stripAnswers(processedQuestions);
    }

    return res.json({ success: true, test, previousResult, attempt: existingAttempt });
  } catch (err) {
    next(err);
  }
};

// ─── startAttempt (Initialize Attempt in Supabase) ───────────────────────────

const startAttempt = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const testId = req.params.id;

    // Verify assignment (or allow open published test with no restricted assignments)
    const { data: assignment } = await supabase
      .from('assignments')
      .select('id')
      .eq('test_id', testId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (!assignment) {
      const { count: anyAssignCount } = await supabase
        .from('assignments')
        .select('id', { count: 'exact', head: true })
        .eq('test_id', testId);

      if ((anyAssignCount || 0) > 0) {
        return res.status(403).json({ success: false, message: 'Not assigned to this assessment.' });
      }

      // Auto-create assignment row for open published test
      await supabase
        .from('assignments')
        .upsert(
          { test_id: testId, student_id: studentId, status: 'in_progress' },
          { onConflict: 'test_id,student_id' }
        );
    }

    // Check for active in_progress attempt
    const { data: existingAttempt } = await supabase
      .from('attempts')
      .select('*')
      .eq('test_id', testId)
      .eq('student_id', studentId)
      .eq('status', 'in_progress')
      .maybeSingle();

    if (existingAttempt) {
      return res.json({ success: true, attempt: existingAttempt, message: 'Resumed existing attempt.' });
    }

    // Create new attempt
    const { data: newAttempt, error } = await supabase
      .from('attempts')
      .insert({
        test_id: testId,
        student_id: studentId,
        started_at: new Date().toISOString(),
        status: 'in_progress',
        time_spent: 0,
        score: 0
      })
      .select()
      .single();

    if (error) return next(new Error(error.message));

    // Update assignment status to in_progress
    await supabase
      .from('assignments')
      .update({ status: 'in_progress' })
      .eq('test_id', testId)
      .eq('student_id', studentId);

    return res.status(201).json({ success: true, attempt: newAttempt });
  } catch (err) {
    next(err);
  }
};

// ─── saveAnswer (Auto-save student response in Supabase) ─────────────────────

const saveAnswer = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const testId = req.params.id;
    const { questionIndex, selectedOption, submittedCode, timeSpent } = req.body;

    // Find active attempt
    const { data: attempt } = await supabase
      .from('attempts')
      .select('id')
      .eq('test_id', testId)
      .eq('student_id', studentId)
      .eq('status', 'in_progress')
      .maybeSingle();

    const attemptId = attempt?.id || null;

    // Upsert into submissions table
    // Delete previous answer for this question in this attempt if exists
    if (attemptId) {
      await supabase
        .from('submissions')
        .delete()
        .eq('attempt_id', attemptId)
        .eq('question_index', questionIndex);
    } else {
      await supabase
        .from('submissions')
        .delete()
        .eq('test_id', testId)
        .eq('student_id', studentId)
        .eq('question_index', questionIndex);
    }

    const { data: saved, error } = await supabase
      .from('submissions')
      .insert({
        attempt_id: attemptId,
        test_id: testId,
        student_id: studentId,
        question_index: questionIndex,
        selected_option: selectedOption !== undefined && selectedOption !== null ? Number(selectedOption) : null,
        submitted_code: submittedCode ? String(submittedCode) : null,
        is_correct: false,
        marks_awarded: 0,
      })
      .select()
      .single();

    if (error) return next(new Error(error.message));

    // Optionally update time_spent on attempt
    if (attemptId && timeSpent) {
      await supabase
        .from('attempts')
        .update({ time_spent: Math.max(0, parseInt(timeSpent, 10)) })
        .eq('id', attemptId);
    }

    return res.json({ success: true, message: 'Answer saved.', submission: saved });
  } catch (err) {
    next(err);
  }
};

// ─── createTest ─────────────────────────────────────────────────────────────

const createTest = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      durationMinutes,
      passMarks,
      totalMarks: clientTotalMarks,
      questions,
      isActive = true,
      status = 'published',
      settings = {},
      assignStudents = []
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Assessment title is required.' });
    }

    const duration = Number(durationMinutes);
    if (!duration || duration <= 0) {
      return res.status(400).json({ success: false, message: 'Duration must be greater than 0 minutes.' });
    }

    const qError = validateQuestions(questions);
    if (qError) {
      return res.status(400).json({ success: false, message: qError });
    }

    const computedTotalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
    const finalTotalMarks = clientTotalMarks !== undefined ? Number(clientTotalMarks) : computedTotalMarks;

    let finalPassMarks = passMarks !== undefined ? Number(passMarks) : Math.ceil(finalTotalMarks * 0.4);
    if (finalPassMarks > finalTotalMarks) {
      return res.status(400).json({ success: false, message: 'Passing marks cannot exceed total marks.' });
    }

    const mergedSettings = {
      status: status || 'published',
      negativeMarking: !!settings.negativeMarking,
      negativeMarkValue: Number(settings.negativeMarkValue) || 0.25,
      randomizeQuestions: !!settings.randomizeQuestions,
      allowRetakes: !!settings.allowRetakes,
      maxRetakes: Number(settings.maxRetakes) || 1,
      releaseResultsImmediately: settings.releaseResultsImmediately !== undefined ? !!settings.releaseResultsImmediately : true,
      releaseDate: settings.releaseDate || null,
      scheduledStartTime: settings.scheduledStartTime || null,
      scheduledEndTime: settings.scheduledEndTime || null,
      targetClass: settings.targetClass || 'All Batches',
    };

    const serializedDesc = serializeDescriptionMeta(description, mergedSettings);
    const isPublished = mergedSettings.status === 'published';

    const { data, error } = await supabase
      .from('tests')
      .insert({
        title: title.trim(),
        description: serializedDesc,
        category: category || 'Technical',
        duration_minutes: duration,
        questions,
        total_marks: finalTotalMarks,
        pass_marks: finalPassMarks,
        is_active: isPublished ? (isActive !== undefined ? isActive : true) : false,
        created_by: req.user.id,
      })
      .select()
      .single();

    if (error) return next(new Error(error.message));

    // Auto-assign students if provided
    if (Array.isArray(assignStudents) && assignStudents.length > 0) {
      const assignmentRows = assignStudents.map((sid) => ({
        test_id: data.id,
        student_id: sid,
        assigned_by: req.user.id,
        due_date: mergedSettings.scheduledEndTime || null,
        status: 'pending'
      }));

      await supabase.from('assignments').upsert(assignmentRows, { onConflict: 'test_id,student_id' });
    }

    return res.status(201).json({
      success: true,
      message: `Assessment ${mergedSettings.status === 'draft' ? 'saved as draft' : 'published'} successfully.`,
      test: formatTest(data)
    });
  } catch (err) {
    next(err);
  }
};

// ─── updateTest ─────────────────────────────────────────────────────────────

const updateTest = async (req, res, next) => {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('tests')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ success: false, message: 'Assessment not found.' });
    }

    const {
      title,
      description,
      category,
      durationMinutes,
      passMarks,
      totalMarks,
      questions,
      isActive,
      status,
      settings,
      assignStudents
    } = req.body;

    const updateObj = {};

    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ success: false, message: 'Title cannot be blank.' });
      updateObj.title = title.trim();
    }

    if (category !== undefined) updateObj.category = category;
    if (durationMinutes !== undefined) {
      const dur = Number(durationMinutes);
      if (dur <= 0) return res.status(400).json({ success: false, message: 'Duration must be positive.' });
      updateObj.duration_minutes = dur;
    }

    const currentParsed = parseDescriptionMeta(existing.description);
    const newSettings = {
      ...currentParsed.meta,
      ...(settings || {})
    };
    if (status !== undefined) newSettings.status = status;

    const baseDesc = description !== undefined ? description : currentParsed.description;
    updateObj.description = serializeDescriptionMeta(baseDesc, newSettings);

    if (isActive !== undefined) {
      updateObj.is_active = isActive;
    } else if (status !== undefined) {
      updateObj.is_active = status === 'published';
    }

    if (questions !== undefined) {
      const qError = validateQuestions(questions);
      if (qError) return res.status(400).json({ success: false, message: qError });

      updateObj.questions = questions;
      const computedTotal = questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
      updateObj.total_marks = totalMarks !== undefined ? Number(totalMarks) : computedTotal;
    } else if (totalMarks !== undefined) {
      updateObj.total_marks = Number(totalMarks);
    }

    if (passMarks !== undefined) {
      const pMarks = Number(passMarks);
      const effectiveTotal = updateObj.total_marks !== undefined ? updateObj.total_marks : existing.total_marks;
      if (pMarks > effectiveTotal) {
        return res.status(400).json({ success: false, message: 'Passing marks cannot exceed total marks.' });
      }
      updateObj.pass_marks = pMarks;
    }

    updateObj.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('tests')
      .update(updateObj)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return next(new Error(error.message));

    if (Array.isArray(assignStudents) && assignStudents.length > 0) {
      const assignmentRows = assignStudents.map((sid) => ({
        test_id: data.id,
        student_id: sid,
        assigned_by: req.user.id,
        due_date: newSettings.scheduledEndTime || null,
        status: 'pending'
      }));

      await supabase.from('assignments').upsert(assignmentRows, { onConflict: 'test_id,student_id' });
    }

    return res.json({
      success: true,
      message: 'Assessment updated successfully.',
      test: formatTest(data)
    });
  } catch (err) {
    next(err);
  }
};

// ─── deleteTest ─────────────────────────────────────────────────────────────

const deleteTest = async (req, res, next) => {
  try {
    const isArchive = req.query.archive === 'true';

    if (isArchive) {
      const { data: existing } = await supabase
        .from('tests')
        .select('description')
        .eq('id', req.params.id)
        .single();

      if (existing) {
        const { description, meta } = parseDescriptionMeta(existing.description);
        meta.status = 'archived';
        const newDesc = serializeDescriptionMeta(description, meta);

        await supabase
          .from('tests')
          .update({ is_active: false, description: newDesc, updated_at: new Date().toISOString() })
          .eq('id', req.params.id);

        return res.json({ success: true, message: 'Assessment archived successfully.' });
      }
    }

    // Permanent delete
    await supabase.from('submissions').delete().eq('test_id', req.params.id);
    await supabase.from('attempts').delete().eq('test_id', req.params.id);
    await supabase.from('results').delete().eq('test_id', req.params.id);
    await supabase.from('assignments').delete().eq('test_id', req.params.id);

    const { error } = await supabase
      .from('tests')
      .delete()
      .eq('id', req.params.id);

    if (error) return next(new Error(error.message));

    return res.json({ success: true, message: 'Assessment and all associated records deleted permanently.' });
  } catch (err) {
    next(err);
  }
};

// ─── submitTest (Automatic Evaluation for All Question Types) ────────────────

const submitTest = async (req, res, next) => {
  try {
    const { answers, timeTakenSeconds } = req.body;
    const studentId = req.user.id;
    const testId = req.params.id;

    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('*')
      .eq('id', testId)
      .single();

    if (testError || !test) {
      return res.status(404).json({ success: false, message: 'Assessment not found.' });
    }

    const { meta } = parseDescriptionMeta(test.description);

    if (!test.is_active && meta.status !== 'published') {
      return res.status(400).json({ success: false, message: 'This assessment is currently not active.' });
    }

    // Verify retake policy
    const { data: existing } = await supabase
      .from('results')
      .select('id, score, total_marks')
      .eq('test_id', testId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (existing && !meta.allowRetakes) {
      return res.status(400).json({
        success: false,
        message: 'Retakes are disabled for this assessment. Your score has already been recorded.'
      });
    }

    // Automatic Evaluation Algorithm supporting all MCQ, Aptitude & Arena archetypes
    const questions = test.questions || [];
    let totalScore = 0;

    const evaluatedAnswers = (answers || []).map((a) => {
      // Find question by originalIndex if present, otherwise questionIndex
      const qIdx = a.originalIndex !== undefined ? a.originalIndex : a.questionIndex;
      const question = questions[qIdx];
      let marksAwarded = 0;

      if (!question) {
        return {
          questionIndex: a.questionIndex,
          selectedOption: a.selectedOption,
          submittedAnswer: a.submittedAnswer || a.submittedCode || null,
          isCorrect: false,
          marksAwarded: 0
        };
      }

      const type = question.type || 'multiple_choice';
      let isCorrect = false;
      let isAnswered = false;

      // 1. Single Choice: MCQ, Logical Reasoning, Quantitative Aptitude, Verbal Ability, Output Prediction
      if (['multiple_choice', 'logical_reasoning', 'quantitative_aptitude', 'verbal_ability', 'aptitude', 'output_prediction', 'technical'].includes(type)) {
        if (a.selectedOption !== undefined && a.selectedOption !== null && a.selectedOption !== '') {
          isAnswered = true;
          isCorrect = Number(question.correctAnswer) === Number(a.selectedOption);
        }
      }
      // 2. Multiple Correct Answers
      else if (type === 'multiple_answers') {
        const correctSet = new Set((question.correctAnswers || [question.correctAnswer || 0]).map(Number));
        const selectedArr = Array.isArray(a.selectedOptions)
          ? a.selectedOptions.map(Number)
          : Array.isArray(a.selectedOption)
          ? a.selectedOption.map(Number)
          : [];

        if (selectedArr.length > 0) {
          isAnswered = true;
          const selectedSet = new Set(selectedArr);
          isCorrect = correctSet.size === selectedSet.size && [...correctSet].every((val) => selectedSet.has(val));
        }
      }
      // 3. Numerical Answer (with tolerance support)
      else if (type === 'numerical') {
        const rawNum = a.submittedAnswer !== undefined ? a.submittedAnswer : a.submittedCode;
        if (rawNum !== undefined && rawNum !== null && rawNum !== '') {
          isAnswered = true;
          const candidateVal = parseFloat(rawNum);
          const targetVal = Number(question.correctNumber);
          const tol = Number(question.tolerance) || 0;
          isCorrect = !isNaN(candidateVal) && Math.abs(candidateVal - targetVal) <= tol;
        }
      }
      // 4. Coding & Debugging Arena
      else if (type === 'coding' || type === 'debugging') {
        const code = a.submittedCode || a.submittedAnswer || '';
        if (code && code.trim()) {
          isAnswered = true;
          let parsedJudge0 = null;
          try {
            parsedJudge0 = JSON.parse(code);
          } catch {}

          if (parsedJudge0 && parsedJudge0.testResults && parsedJudge0.totalCount !== undefined) {
            isCorrect = parsedJudge0.passedCount === parsedJudge0.totalCount;
            const qMarks = Number(question.marks) || 1;
            const earned = parsedJudge0.totalCount > 0
              ? Math.round((parsedJudge0.passedCount / parsedJudge0.totalCount) * qMarks * 100) / 100
              : 0;
            marksAwarded = earned;
            totalScore += earned;

            return {
              questionIndex: a.questionIndex,
              originalIndex: qIdx,
              type,
              selectedOption: null,
              selectedOptions: null,
              submittedAnswer: parsedJudge0.sourceCode || parsedJudge0.code || code,
              isCorrect,
              marksAwarded,
              isAnswered,
              executionTime: parsedJudge0.executionTime,
              memoryUsed: parsedJudge0.memoryUsed,
              passedTestCases: parsedJudge0.passedCount,
              totalTestCases: parsedJudge0.totalCount,
              status: parsedJudge0.status
            };
          }

          if (question.correctSolution && question.correctSolution.trim()) {
            isCorrect = code.trim() === question.correctSolution.trim();
          } else if (a.selectedOption !== undefined && a.selectedOption !== null) {
            isCorrect = Number(question.correctAnswer) === Number(a.selectedOption);
          } else {
            isCorrect = true; // Complete submission accepted
          }
        }
      }
      // 5. SQL Query Arena
      else if (type === 'sql') {
        const sql = a.submittedQuery || a.submittedCode || a.submittedAnswer || '';
        if (sql && sql.trim()) {
          isAnswered = true;
          if (question.expectedQuery) {
            isCorrect = sql.toLowerCase().replace(/\s+/g, ' ').trim() ===
                        question.expectedQuery.toLowerCase().replace(/\s+/g, ' ').trim();
          } else if (a.selectedOption !== undefined && a.selectedOption !== null) {
            isCorrect = Number(question.correctAnswer) === Number(a.selectedOption);
          }
        }
      }

      const qMarks = Number(question.marks) || 1;
      marksAwarded = 0;

      if (isCorrect) {
        marksAwarded = qMarks;
        totalScore += qMarks;
      } else if (meta.negativeMarking && isAnswered) {
        // Deduct negative marking penalty if answered incorrectly
        const penalty = Number(meta.negativeMarkValue) || 0.25;
        marksAwarded = -penalty;
        totalScore = Math.max(0, totalScore - penalty);
      }

      return {
        questionIndex: a.questionIndex,
        originalIndex: qIdx,
        type,
        selectedOption: a.selectedOption !== undefined ? a.selectedOption : null,
        selectedOptions: a.selectedOptions || null,
        submittedAnswer: a.submittedAnswer || a.submittedCode || null,
        isCorrect,
        marksAwarded,
        isAnswered
      };
    });

    const finalScore = Math.max(0, Math.round(totalScore * 100) / 100);
    const passed = finalScore >= test.pass_marks;

    // 1. Update or Insert Result in Supabase
    let result;
    if (existing && meta.allowRetakes) {
      const { data: updatedResult, error: updateError } = await supabase
        .from('results')
        .update({
          answers: evaluatedAnswers,
          score: finalScore,
          total_marks: test.total_marks,
          passed,
          time_taken_seconds: timeTakenSeconds || 0,
          created_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) return next(new Error(updateError.message));
      result = updatedResult;
    } else {
      const { data: newResult, error: insertError } = await supabase
        .from('results')
        .insert({
          test_id: testId,
          student_id: studentId,
          answers: evaluatedAnswers,
          score: finalScore,
          total_marks: test.total_marks,
          passed,
          time_taken_seconds: timeTakenSeconds || 0,
        })
        .select()
        .single();

      if (insertError) return next(new Error(insertError.message));
      result = newResult;
    }

    // 2. Mark in-progress attempt completed in Supabase
    const { data: activeAttempt } = await supabase
      .from('attempts')
      .select('id')
      .eq('test_id', testId)
      .eq('student_id', studentId)
      .eq('status', 'in_progress')
      .maybeSingle();

    if (activeAttempt) {
      await supabase
        .from('attempts')
        .update({
          status: 'submitted',
          completed_at: new Date().toISOString(),
          time_spent: timeTakenSeconds || 0,
          score: finalScore
        })
        .eq('id', activeAttempt.id);

      // Record final submissions in submissions table
      for (const ans of evaluatedAnswers) {
        await supabase
          .from('submissions')
          .delete()
          .eq('attempt_id', activeAttempt.id)
          .eq('question_index', ans.questionIndex);

        await supabase.from('submissions').insert({
          attempt_id: activeAttempt.id,
          test_id: testId,
          student_id: studentId,
          question_index: ans.questionIndex,
          selected_option: ans.selectedOption !== null && ans.selectedOption !== undefined ? Number(ans.selectedOption) : null,
          submitted_code: ans.submittedAnswer ? String(ans.submittedAnswer) : null,
          is_correct: ans.isCorrect,
          marks_awarded: Math.max(0, ans.marksAwarded)
        });
      }
    }

    // 3. Mark assignment completed
    await supabase
      .from('assignments')
      .update({ status: 'completed' })
      .eq('test_id', testId)
      .eq('student_id', studentId);

    // 4. Secure Result Response based on Admin Release Policy
    const releaseImmediately = meta.releaseResultsImmediately !== false;
    let resultsReleased = releaseImmediately;

    if (!releaseImmediately && meta.releaseDate) {
      resultsReleased = new Date() >= new Date(meta.releaseDate);
    }

    const formatted = formatResult(result);
    formatted.test = {
      _id: test.id,
      title: test.title,
      category: test.category,
      totalMarks: test.total_marks,
      passMarks: test.pass_marks,
      resultsReleased,
      releaseDate: meta.releaseDate || null
    };

    if (!resultsReleased) {
      // Conceal final marks and detailed answers until released
      formatted.score = null;
      formatted.passed = null;
      formatted.answers = [];
    }

    return res.status(201).json({
      success: true,
      message: 'Assessment submitted and evaluated successfully.',
      result: formatted
    });
  } catch (err) {
    next(err);
  }
};

// ─── getMyResults ───────────────────────────────────────────────────────────

const getMyResults = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('results')
      .select('*, tests(id, title, category, description, total_marks, pass_marks, duration_minutes)')
      .eq('student_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) return next(new Error(error.message));

    const results = (data || []).map((r) => {
      const formatted = formatResult(r);
      if (r.tests) {
        const { meta } = parseDescriptionMeta(r.tests.description);
        const releaseImmediately = meta.releaseResultsImmediately !== false;
        const isReleased = releaseImmediately || (meta.releaseDate && new Date() >= new Date(meta.releaseDate));

        formatted.test = {
          _id: r.tests.id,
          title: r.tests.title,
          category: r.tests.category,
          totalMarks: r.tests.total_marks,
          passMarks: r.tests.pass_marks,
          durationMinutes: r.tests.duration_minutes,
          isReleased,
          releaseDate: meta.releaseDate || null
        };

        if (!isReleased) {
          formatted.score = null;
          formatted.passed = null;
          formatted.answers = [];
        }
      }
      return formatted;
    });

    return res.json({ success: true, count: results.length, results });
  } catch (err) {
    next(err);
  }
};

// ─── getTestResultsAdmin ────────────────────────────────────────────────────

const getTestResultsAdmin = async (req, res, next) => {
  try {
    const { data: test, error: testErr } = await supabase
      .from('tests')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (testErr || !test) {
      return res.status(404).json({ success: false, message: 'Assessment not found.' });
    }

    const { data: results, error: resultsErr } = await supabase
      .from('results')
      .select('*, profiles!student_id(id, name, email)')
      .eq('test_id', req.params.id)
      .order('score', { ascending: false });

    if (resultsErr) return next(new Error(resultsErr.message));

    return res.json({
      success: true,
      test: formatTest(test),
      count: (results || []).length,
      results: (results || []).map((r) => ({
        _id: r.id,
        score: r.score,
        totalMarks: r.total_marks,
        passed: r.passed,
        timeTakenSeconds: r.time_taken_seconds,
        createdAt: r.created_at,
        student: r.profiles ? { _id: r.profiles.id, name: r.profiles.name, email: r.profiles.email } : null
      }))
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTests,
  getTestById,
  startAttempt,
  saveAnswer,
  createTest,
  updateTest,
  deleteTest,
  submitTest,
  getMyResults,
  getTestResultsAdmin,
};
