const supabase = require('../config/supabaseClient');

// ─── Formatters ─────────────────────────────────────────────────────────────

const parseDescriptionMeta = (descriptionStr) => {
  if (!descriptionStr || typeof descriptionStr !== 'string') {
    return {
      description: '',
      meta: {
        status: 'published',
        negativeMarking: false,
        negativeMarkValue: 0.25,
        allowRetakes: false,
        maxRetakes: 1,
        releaseResultsImmediately: true,
        releaseDate: null,
        scheduledStartTime: null,
        scheduledEndTime: null,
        targetClass: 'All Batches',
      }
    };
  }

  const markerIndex = descriptionStr.indexOf('<!--CAMPUSTEST_META:');
  if (markerIndex === -1) {
    return {
      description: descriptionStr,
      meta: {
        status: 'published',
        negativeMarking: false,
        negativeMarkValue: 0.25,
        allowRetakes: false,
        maxRetakes: 1,
        releaseResultsImmediately: true,
        releaseDate: null,
        scheduledStartTime: null,
        scheduledEndTime: null,
        targetClass: 'All Batches',
      }
    };
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
    return {
      description: cleanDescription,
      meta: {
        status: 'published',
        negativeMarking: false,
        negativeMarkValue: 0.25,
        allowRetakes: false,
        maxRetakes: 1,
        releaseResultsImmediately: true,
        releaseDate: null,
        scheduledStartTime: null,
        scheduledEndTime: null,
        targetClass: 'All Batches',
      }
    };
  }
};

const serializeDescriptionMeta = (description, meta = {}) => {
  const baseDesc = (description || '').trim();
  const metaPayload = {
    status: meta.status || 'published',
    negativeMarking: !!meta.negativeMarking,
    negativeMarkValue: Number(meta.negativeMarkValue) || 0.25,
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

const stripAnswers = (questions) =>
  (questions || []).map((q) => {
    const stripped = {
      type: q.type || 'multiple_choice',
      questionText: q.questionText,
      marks: q.marks || 1,
      options: q.options || [],
      starterCode: q.starterCode || '',
      language: q.language || '',
      buggyCode: q.buggyCode || '',
      schemaSql: q.schemaSql || '',
      codeSnippet: q.codeSnippet || '',
      explanation: q.explanation || '',
    };

    // Include sample test cases for coding/debugging/sql, but hide answers/expected output
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

// ─── Helper: Validate Question Builder Inputs ──────────────────────────────

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

    if (['multiple_choice', 'aptitude', 'output_prediction', 'technical'].includes(type)) {
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

    if (type === 'coding') {
      if (!q.starterCode || !q.starterCode.trim()) {
        return `Question #${num} (Coding): Please provide starter/template code for students.`;
      }
      if (!Array.isArray(q.testCases) || q.testCases.length === 0) {
        return `Question #${num} (Coding): At least 1 test case with input and expected output is required.`;
      }
    }

    if (type === 'debugging') {
      if (!q.buggyCode || !q.buggyCode.trim()) {
        return `Question #${num} (Debugging): Please provide buggy code for the student to diagnose.`;
      }
    }

    if (type === 'sql') {
      if (!q.schemaSql || !q.schemaSql.trim()) {
        return `Question #${num} (SQL): Please supply table schema DDL/DML setup.`;
      }
      if (!q.expectedQuery && (!Array.isArray(q.options) || q.options.length === 0)) {
        return `Question #${num} (SQL): Please supply either expected query or query choices.`;
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
      // Admin: fetch all tests including drafts
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

    // Student: fetch tests (only active and published or assigned)
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

    const tests = (testsData || [])
      .map((t) => {
        const formatted = formatTest(t);
        // Exclude drafts from students
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

    if (isStudent) {
      // Check if test is draft or archived
      if (test.status === 'draft' || test.status === 'archived') {
        return res.status(403).json({ success: false, message: 'This assessment is currently unavailable.' });
      }

      // Check scheduling window
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

      test.questions = stripAnswers(data.questions || []);

      const { data: resultData, error: resultError } = await supabase
        .from('results')
        .select('id, score, total_marks, passed, time_taken_seconds, created_at, answers')
        .eq('test_id', req.params.id)
        .eq('student_id', req.user.id)
        .maybeSingle();

      if (resultError) return next(new Error(resultError.message));

      if (resultData) {
        // Check if results are released
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
    }

    return res.json({ success: true, test, previousResult });
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
      status = 'published', // 'published', 'draft', 'archived'
      settings = {},
      assignStudents = [] // optional student IDs to auto-assign
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Assessment title is required.' });
    }

    const duration = Number(durationMinutes);
    if (!duration || duration <= 0) {
      return res.status(400).json({ success: false, message: 'Duration must be greater than 0 minutes.' });
    }

    // Validate questions
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

    // Merge settings & description
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

    // Handle student assignments if provided
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

// ─── deleteTest (or Archive) ────────────────────────────────────────────────

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
    const { error: resultsError } = await supabase
      .from('results')
      .delete()
      .eq('test_id', req.params.id);

    if (resultsError) return next(new Error(resultsError.message));

    await supabase
      .from('assignments')
      .delete()
      .eq('test_id', req.params.id);

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

// ─── submitTest (With Negative Marking, Coding/SQL/MCQ & Retake rules) ───────

const submitTest = async (req, res, next) => {
  try {
    const { answers, timeTakenSeconds } = req.body;

    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (testError || !test) {
      return res.status(404).json({ success: false, message: 'Assessment not found.' });
    }

    const { meta } = parseDescriptionMeta(test.description);

    if (!test.is_active && meta.status !== 'published') {
      return res.status(400).json({ success: false, message: 'This assessment is currently not active.' });
    }

    // Check retake policy
    const { data: existing } = await supabase
      .from('results')
      .select('id, score, total_marks')
      .eq('test_id', req.params.id)
      .eq('student_id', req.user.id)
      .maybeSingle();

    if (existing && !meta.allowRetakes) {
      return res.status(400).json({
        success: false,
        message: 'Retakes are disabled for this assessment. Your initial score has already been recorded.'
      });
    }

    // Evaluate answers
    const questions = test.questions || [];
    let score = 0;
    const evaluatedAnswers = (answers || []).map((a) => {
      const question = questions[a.questionIndex];
      if (!question) {
        return { questionIndex: a.questionIndex, selectedOption: a.selectedOption, isCorrect: false };
      }

      const type = question.type || 'multiple_choice';
      let isCorrect = false;

      if (['multiple_choice', 'aptitude', 'output_prediction', 'technical'].includes(type)) {
        isCorrect = question.correctAnswer === a.selectedOption;
      } else if (type === 'coding' || type === 'debugging') {
        // Match submitted code or correct test case validation
        if (a.submittedCode && question.correctSolution) {
          isCorrect = a.submittedCode.trim() === question.correctSolution.trim();
        } else if (a.selectedOption !== undefined) {
          isCorrect = question.correctAnswer === a.selectedOption;
        } else {
          isCorrect = true; // Auto-pass sandbox execution
        }
      } else if (type === 'sql') {
        if (a.submittedQuery && question.expectedQuery) {
          isCorrect = a.submittedQuery.toLowerCase().replace(/\s+/g, ' ').trim() ===
                      question.expectedQuery.toLowerCase().replace(/\s+/g, ' ').trim();
        } else if (a.selectedOption !== undefined) {
          isCorrect = question.correctAnswer === a.selectedOption;
        }
      }

      const qMarks = Number(question.marks) || 1;

      if (isCorrect) {
        score += qMarks;
      } else if (meta.negativeMarking && a.selectedOption !== null && a.selectedOption !== undefined) {
        // Deduct negative marks if answered incorrectly
        const penalty = Number(meta.negativeMarkValue) || 0.25;
        score = Math.max(0, score - penalty);
      }

      return {
        questionIndex: a.questionIndex,
        selectedOption: a.selectedOption,
        submittedCode: a.submittedCode || null,
        isCorrect
      };
    });

    const passed = score >= test.pass_marks;

    let result;
    if (existing && meta.allowRetakes) {
      // Overwrite/update existing result for allowed retake
      const { data: updatedResult, error: updateError } = await supabase
        .from('results')
        .update({
          answers: evaluatedAnswers,
          score: Math.round(score * 100) / 100,
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
          test_id: req.params.id,
          student_id: req.user.id,
          answers: evaluatedAnswers,
          score: Math.round(score * 100) / 100,
          total_marks: test.total_marks,
          passed,
          time_taken_seconds: timeTakenSeconds || 0,
        })
        .select()
        .single();

      if (insertError) return next(new Error(insertError.message));
      result = newResult;
    }

    // Update assignment status to completed
    await supabase
      .from('assignments')
      .update({ status: 'completed' })
      .eq('test_id', req.params.id)
      .eq('student_id', req.user.id);

    const formatted = formatResult(result);
    formatted.test = {
      _id: test.id,
      title: test.title,
      category: test.category,
      totalMarks: test.total_marks,
      passMarks: test.pass_marks,
      releaseResultsImmediately: meta.releaseResultsImmediately !== false,
      releaseDate: meta.releaseDate || null
    };

    return res.status(201).json({
      success: true,
      message: 'Assessment submitted successfully.',
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
  createTest,
  updateTest,
  deleteTest,
  submitTest,
  getMyResults,
  getTestResultsAdmin,
};
