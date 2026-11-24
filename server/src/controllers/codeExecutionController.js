const supabase = require('../config/supabaseClient');
const judge0Service = require('../services/judge0Service');

/**
 * 1. RUN CODE WITH CUSTOM INPUT
 * POST /api/code/run
 */
const runCode = async (req, res, next) => {
  try {
    const { sourceCode, language, stdin } = req.body;

    if (!sourceCode || typeof sourceCode !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Source code is required.'
      });
    }

    const output = await judge0Service.executeCode({
      sourceCode,
      language: language || 'javascript',
      stdin: stdin || ''
    });

    return res.status(200).json({
      success: true,
      output: {
        stdout: output.stdout,
        stderr: output.stderr,
        compile_output: output.compile_output,
        time: output.time,
        memory: output.memory,
        status: output.status
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. SUBMIT CODE AGAINST PUBLIC & HIDDEN TEST CASES
 * POST /api/code/submit
 */
const submitCode = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { testId, questionIndex, sourceCode, language } = req.body;

    if (!testId || questionIndex === undefined || !sourceCode) {
      return res.status(400).json({
        success: false,
        message: 'testId, questionIndex, and sourceCode are required.'
      });
    }

    // 1. Fetch assessment from Supabase
    const { data: test, error: testErr } = await supabase
      .from('tests')
      .select('id, questions, total_marks')
      .eq('id', testId)
      .single();

    if (testErr || !test) {
      return res.status(404).json({ success: false, message: 'Assessment not found.' });
    }

    // 2. Locate question by index
    const questions = Array.isArray(test.questions) ? test.questions : [];
    const qIndex = parseInt(questionIndex, 10);
    const question = questions[qIndex];

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found in assessment.' });
    }

    const testCases = Array.isArray(question.testCases) ? question.testCases : [];
    const questionMarks = Number(question.marks) || 1;

    // 3. Execute code against all test cases (both public and hidden)
    const evalResult = await judge0Service.runAgainstTestCases({
      sourceCode,
      language: language || question.language || 'javascript',
      testCases
    });

    // 4. Calculate score
    const passedCount = evalResult.passedCount;
    const totalCount = evalResult.totalCount;
    const earnedMarks = totalCount > 0 ? Math.round((passedCount / totalCount) * questionMarks * 100) / 100 : 0;
    const isCorrect = evalResult.passed;

    // 5. Store in Supabase attempts / submissions
    // Find active attempt for this student
    const { data: attempt } = await supabase
      .from('attempts')
      .select('id')
      .eq('test_id', testId)
      .eq('student_id', studentId)
      .eq('status', 'in_progress')
      .maybeSingle();

    const attemptId = attempt?.id || null;

    // Structured metadata to persist in submitted_code column
    const submissionPayload = JSON.stringify({
      sourceCode,
      language: language || question.language || 'javascript',
      passedCount,
      totalCount,
      score: earnedMarks,
      maxScore: questionMarks,
      executionTime: evalResult.executionTime,
      memoryUsed: evalResult.memoryUsed,
      status: evalResult.status,
      testResults: evalResult.results
    });

    // Delete existing submission for this question in this attempt/test
    if (attemptId) {
      await supabase
        .from('submissions')
        .delete()
        .eq('attempt_id', attemptId)
        .eq('question_index', qIndex);
    } else {
      await supabase
        .from('submissions')
        .delete()
        .eq('test_id', testId)
        .eq('student_id', studentId)
        .eq('question_index', qIndex);
    }

    // Insert new evaluated submission
    const { data: savedSubmission, error: insertErr } = await supabase
      .from('submissions')
      .insert({
        attempt_id: attemptId,
        test_id: testId,
        student_id: studentId,
        question_index: qIndex,
        selected_option: null,
        submitted_code: submissionPayload,
        is_correct: isCorrect,
        marks_awarded: Math.round(earnedMarks)
      })
      .select()
      .single();

    if (insertErr) {
      console.warn('[submitCode] Submissions table insert warning:', insertErr.message);
    }

    // 6. Return response to student (safe: hidden test case secrets masked)
    return res.status(200).json({
      success: true,
      submissionId: savedSubmission?.id || null,
      result: {
        passed: isCorrect,
        passedCount,
        totalCount,
        score: earnedMarks,
        maxScore: questionMarks,
        executionTime: evalResult.executionTime,
        memoryUsed: evalResult.memoryUsed,
        status: evalResult.status,
        testResults: evalResult.results
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 3. GET SUBMISSION STATUS & EXECUTION DETAILS
 * GET /api/code/status/:submissionId
 */
const getSubmissionStatus = async (req, res, next) => {
  try {
    const { submissionId } = req.params;

    const { data: submission, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (error || !submission) {
      return res.status(404).json({ success: false, message: 'Submission record not found.' });
    }

    let parsed = null;
    try {
      parsed = JSON.parse(submission.submitted_code);
    } catch {
      parsed = { code: submission.submitted_code };
    }

    return res.status(200).json({
      success: true,
      submission: {
        id: submission.id,
        testId: submission.test_id,
        questionIndex: submission.question_index,
        isCorrect: submission.is_correct,
        marksAwarded: submission.marks_awarded,
        createdAt: submission.created_at,
        details: parsed
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  runCode,
  submitCode,
  getSubmissionStatus
};
