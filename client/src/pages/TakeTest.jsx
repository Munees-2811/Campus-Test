import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card, { CardBody, CardFooter, CardHeader } from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import { useTheme } from '../context/ThemeContext';
import testService from '../services/testService';
import CodeEditor from '../components/student/CodeEditor';
import CodeExecutionPanel from '../components/student/CodeExecutionPanel';
import CodingArenaView from '../components/student/CodingArenaView';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Award,
  GraduationCap,
  Sun,
  Moon,
  ChevronRight,
  Check,
  Code2,
  Bug,
  Cpu,
  Brain,
  Database,
  Terminal,
  Calculator,
  Hash,
  BookOpen,
  Bookmark,
  RotateCcw,
  Sparkles,
  CheckSquare
} from 'lucide-react';

const TakeTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Assessment Navigation & Interactive State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [qIdx]: singleOptionIdx }
  const [multiAnswers, setMultiAnswers] = useState({}); // { [qIdx]: [optIdx1, optIdx2] }
  const [numericalAnswers, setNumericalAnswers] = useState({}); // { [qIdx]: numberString }
  const [codeAnswers, setCodeAnswers] = useState({}); // { [qIdx]: codeString }
  const [codeExecutionResults, setCodeExecutionResults] = useState({}); // { [qIdx]: judge0ResultObj }
  const [selectedLanguages, setSelectedLanguages] = useState({}); // { [qIdx]: 'javascript'|'python'|... }
  const [sqlAnswers, setSqlAnswers] = useState({}); // { [qIdx]: sqlQueryString }
  const [markedForReview, setMarkedForReview] = useState(new Set()); // Set of qIdx
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saving' | 'saved' | 'idle'

  // Result state after submission
  const [submissionResult, setSubmissionResult] = useState(null);

  // Track attempt id
  const attemptIdRef = useRef(null);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        const data = await testService.getTestById(id);

        if (data.previousResult) {
          setSubmissionResult(data.previousResult);
        } else {
          setTest(data.test);
          setTimeLeft((data.test.durationMinutes || 30) * 60);

          // Start or resume attempt in Supabase
          try {
            const attemptRes = await testService.startAttempt(id);
            if (attemptRes.attempt) {
              attemptIdRef.current = attemptRes.attempt.id;
            }
          } catch (attErr) {
            console.warn('[TakeTest] Attempt initialize notice:', attErr.message);
          }

          // Prepopulate starter code or restored answers if attempt was resumed
          const initialCode = {};
          const initialSql = {};
          const initialSingle = {};
          const initialMulti = {};
          const initialNum = {};

          if (data.attempt?.savedAnswers) {
            data.attempt.savedAnswers.forEach((sa) => {
              const qIdx = sa.question_index;
              const qObj = data.test.questions[qIdx];
              const qType = qObj?.type || 'multiple_choice';

              if (qType === 'multiple_answers' && sa.submitted_code) {
                try {
                  initialMulti[qIdx] = JSON.parse(sa.submitted_code);
                } catch {
                  initialMulti[qIdx] = [];
                }
              } else if (qType === 'numerical' && sa.submitted_code) {
                initialNum[qIdx] = sa.submitted_code;
              } else if (qType === 'sql' && sa.submitted_code) {
                initialSql[qIdx] = sa.submitted_code;
              } else if (['coding', 'debugging'].includes(qType) && sa.submitted_code) {
                try {
                  const parsed = JSON.parse(sa.submitted_code);
                  if (parsed && (parsed.sourceCode || parsed.code)) {
                    initialCode[qIdx] = parsed.sourceCode || parsed.code;
                    setCodeExecutionResults((prev) => ({ ...prev, [qIdx]: parsed }));
                    if (parsed.language) {
                      setSelectedLanguages((prev) => ({ ...prev, [qIdx]: parsed.language }));
                    }
                  } else {
                    initialCode[qIdx] = sa.submitted_code;
                  }
                } catch {
                  initialCode[qIdx] = sa.submitted_code;
                }
              } else if (sa.selected_option !== null && sa.selected_option !== undefined) {
                initialSingle[qIdx] = sa.selected_option;
              }
            });
          }

          // Set default templates for unfilled items
          (data.test.questions || []).forEach((q, idx) => {
            if (q.type === 'coding' && q.starterCode && !initialCode[idx]) {
              if (typeof q.starterCode === 'object') {
                const lang = selectedLanguages[idx] || q.language || 'javascript';
                initialCode[idx] = q.starterCode[lang] || Object.values(q.starterCode)[0] || '';
              } else {
                initialCode[idx] = q.starterCode;
              }
            } else if (q.type === 'debugging' && q.buggyCode && !initialCode[idx]) {
              initialCode[idx] = q.buggyCode;
            } else if (q.type === 'sql' && !initialSql[idx]) {
              initialSql[idx] = '-- Write your SQL query below:\n';
            }
          });

          setSelectedAnswers(initialSingle);
          setMultiAnswers(initialMulti);
          setNumericalAnswers(initialNum);
          setCodeAnswers(initialCode);
          setSqlAnswers(initialSql);
        }
      } catch (err) {
        setError(err.message || 'Failed to load assessment');
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [id]);

  // Countdown timer with auto-submit
  useEffect(() => {
    if (!test || submissionResult || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [test, submissionResult, timeLeft]);

  // Auto-save helper to synchronize answer with Supabase
  const triggerAutoSave = async (payload) => {
    setAutoSaveStatus('saving');
    try {
      await testService.saveAnswer(id, {
        ...payload,
        timeSpent: test ? (test.durationMinutes * 60) - timeLeft : 0
      });
      setAutoSaveStatus('saved');
    } catch (saveErr) {
      console.warn('[TakeTest] Auto-save background notice:', saveErr.message);
      setAutoSaveStatus('idle');
    }
  };

  // 1. Single Choice Selection (MCQ, Logic, Quant, Verbal, Output Prediction)
  const handleSelectOption = (optIndex) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQIndex]: optIndex
    }));

    triggerAutoSave({
      questionIndex: currentQIndex,
      selectedOption: optIndex,
      submittedCode: null
    });
  };

  // 2. Multiple Answers Selection (Checkboxes)
  const handleToggleMultiOption = (optIndex) => {
    setMultiAnswers((prev) => {
      const current = prev[currentQIndex] || [];
      let updated;
      if (current.includes(optIndex)) {
        updated = current.filter((i) => i !== optIndex);
      } else {
        updated = [...current, optIndex].sort((a, b) => a - b);
      }

      triggerAutoSave({
        questionIndex: currentQIndex,
        selectedOption: null,
        submittedCode: JSON.stringify(updated)
      });

      return { ...prev, [currentQIndex]: updated };
    });
  };

  // 3. Numerical Answer Input
  const handleNumericalChange = (val) => {
    setNumericalAnswers((prev) => ({
      ...prev,
      [currentQIndex]: val
    }));

    triggerAutoSave({
      questionIndex: currentQIndex,
      selectedOption: null,
      submittedCode: val
    });
  };

  // 4. Code Change (Coding & Debugging)
  const handleCodeChange = (code) => {
    setCodeAnswers((prev) => ({
      ...prev,
      [currentQIndex]: code
    }));

    triggerAutoSave({
      questionIndex: currentQIndex,
      selectedOption: null,
      submittedCode: code
    });
  };

  // 5. SQL Query Change
  const handleSqlChange = (query) => {
    setSqlAnswers((prev) => ({
      ...prev,
      [currentQIndex]: query
    }));

    triggerAutoSave({
      questionIndex: currentQIndex,
      selectedOption: null,
      submittedCode: query
    });
  };

  // 6. Clear Answer Option
  const handleClearAnswer = () => {
    const q = test.questions[currentQIndex];
    const type = q?.type || 'multiple_choice';

    if (type === 'multiple_answers') {
      setMultiAnswers((prev) => {
        const copy = { ...prev };
        delete copy[currentQIndex];
        return copy;
      });
    } else if (type === 'numerical') {
      setNumericalAnswers((prev) => {
        const copy = { ...prev };
        delete copy[currentQIndex];
        return copy;
      });
    } else if (type === 'sql') {
      setSqlAnswers((prev) => ({ ...prev, [currentQIndex]: '-- Write your SQL query below:\n' }));
    } else if (['coding', 'debugging'].includes(type)) {
      setCodeAnswers((prev) => ({ ...prev, [currentQIndex]: q.starterCode || q.buggyCode || '' }));
    } else {
      setSelectedAnswers((prev) => {
        const copy = { ...prev };
        delete copy[currentQIndex];
        return copy;
      });
    }

    triggerAutoSave({
      questionIndex: currentQIndex,
      selectedOption: null,
      submittedCode: null
    });
  };

  // 7. Mark for Review Toggle
  const handleToggleMarkForReview = () => {
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(currentQIndex)) {
        next.delete(currentQIndex);
      } else {
        next.add(currentQIndex);
      }
      return next;
    });
  };

  // Submit and Evaluated Test in Supabase
  const handleSubmitTest = async () => {
    try {
      setIsSubmitting(true);
      setIsConfirmModalOpen(false);

      const questions = test.questions || [];
      const formattedAnswers = questions.map((q, idx) => {
        const type = q.type || 'multiple_choice';
        let selOption = null;
        let selOptions = null;
        let subAnswer = null;

        if (type === 'multiple_answers') {
          selOptions = multiAnswers[idx] || [];
        } else if (type === 'numerical') {
          subAnswer = numericalAnswers[idx] || null;
        } else if (type === 'sql') {
          subAnswer = sqlAnswers[idx] || null;
          selOption = selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : null;
        } else if (['coding', 'debugging'].includes(type)) {
          const rawCode = codeAnswers[idx] || '';
          const execRes = codeExecutionResults[idx];
          if (execRes) {
            subAnswer = JSON.stringify({
              sourceCode: rawCode,
              language: selectedLanguages[idx] || q.language || 'javascript',
              passedCount: execRes.passedCount,
              totalCount: execRes.totalCount,
              score: execRes.score,
              maxScore: execRes.maxScore,
              executionTime: execRes.executionTime,
              memoryUsed: execRes.memoryUsed,
              status: execRes.status,
              testResults: execRes.testResults
            });
          } else {
            subAnswer = rawCode;
          }
          selOption = selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : null;
        } else {
          selOption = selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : null;
        }

        return {
          questionIndex: idx,
          originalIndex: q.originalIndex !== undefined ? q.originalIndex : idx,
          selectedOption: selOption,
          selectedOptions: selOptions,
          submittedAnswer: subAnswer
        };
      });

      const totalTimeSpent = (test.durationMinutes * 60) - timeLeft;

      const res = await testService.submitTest(id, {
        answers: formattedAnswers,
        timeTakenSeconds: Math.max(0, totalTimeSpent)
      });

      setSubmissionResult(res.result);
    } catch (err) {
      alert(err.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'multiple_answers': return <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />;
      case 'numerical': return <Calculator className="w-3.5 h-3.5 text-amber-500" />;
      case 'logical_reasoning': return <Brain className="w-3.5 h-3.5 text-purple-500" />;
      case 'quantitative_aptitude': return <Hash className="w-3.5 h-3.5 text-emerald-500" />;
      case 'verbal_ability': return <BookOpen className="w-3.5 h-3.5 text-sky-500" />;
      case 'coding': return <Code2 className="w-3.5 h-3.5 text-blue-500" />;
      case 'debugging': return <Bug className="w-3.5 h-3.5 text-rose-500" />;
      case 'sql': return <Database className="w-3.5 h-3.5 text-teal-500" />;
      case 'output_prediction': return <Terminal className="w-3.5 h-3.5 text-violet-500" />;
      default: return <Cpu className="w-3.5 h-3.5 text-electric-500" />;
    }
  };

  const isQuestionAnswered = (idx) => {
    if (!test || !test.questions[idx]) return false;
    const q = test.questions[idx];
    const type = q.type || 'multiple_choice';

    if (type === 'multiple_answers') {
      return Array.isArray(multiAnswers[idx]) && multiAnswers[idx].length > 0;
    }
    if (type === 'numerical') {
      return numericalAnswers[idx] !== undefined && numericalAnswers[idx] !== '' && numericalAnswers[idx] !== null;
    }
    if (type === 'sql') {
      return !!sqlAnswers[idx] && sqlAnswers[idx].trim().length > 10;
    }
    if (['coding', 'debugging'].includes(type)) {
      return (!!codeAnswers[idx] && codeAnswers[idx].trim().length > 10) || !!codeExecutionResults[idx];
    }
    return selectedAnswers[idx] !== undefined && selectedAnswers[idx] !== null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex items-center justify-center">
        <Loader fullScreen message="Setting up secure examination room..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Unable to Start Assessment</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
          <Button variant="primary" onClick={() => navigate('/student/dashboard')} className="w-full">
            Return to Portal
          </Button>
        </Card>
      </div>
    );
  }

  // Result Scorecard Screen
  if (submissionResult) {
    const resultsReleased = submissionResult.resultsReleased !== false;

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex flex-col justify-between transition-colors">
        <header className="h-16 bg-white dark:bg-navy-900 border-b border-slate-200 dark:border-navy-800 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-navy-900 dark:bg-electric-600 flex items-center justify-center text-white">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">CampusTest</span>
          </div>

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-800"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-navy-800" />}
          </button>
        </header>

        <main className="max-w-md mx-auto w-full px-4 py-12">
          <Card className="text-center shadow-lg border-slate-200 dark:border-navy-800">
            <CardBody className="p-8 space-y-6">
              <div
                className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center border shadow-xs ${
                  resultsReleased
                    ? submissionResult.passed
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                }`}
              >
                <Award className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Assessment Completed
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {resultsReleased
                    ? 'Your evaluation has been automatically graded and recorded in Supabase.'
                    : 'Your answers have been securely recorded. Scores and answers will be released on the scheduled announcement date.'}
                </p>
              </div>

              {resultsReleased ? (
                <div className="p-4 bg-slate-50 dark:bg-navy-850/80 rounded-xl space-y-3 border border-slate-100 dark:border-navy-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Evaluation Status</span>
                    <Badge variant={submissionResult.passed ? 'success' : 'danger'} size="sm" dot>
                      {submissionResult.passed ? 'PASSED' : 'FAILED'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Total Score</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {submissionResult.score} / {submissionResult.totalMarks}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Percentage</span>
                    <span className="font-semibold text-electric-600 dark:text-electric-400 text-sm">
                      {Math.round((submissionResult.score / (submissionResult.totalMarks || 1)) * 100)}%
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
                  <Clock className="w-4 h-4 mb-1 inline mr-1" />
                  Official results will be announced: <strong>{submissionResult.releaseDate ? new Date(submissionResult.releaseDate).toLocaleString() : 'After evaluation window'}</strong>
                </div>
              )}

              <Button
                variant="primary"
                className="w-full"
                onClick={() => navigate('/student/dashboard')}
              >
                Return to Student Portal
              </Button>
            </CardBody>
          </Card>
        </main>

        <footer className="py-4 text-center text-[11px] text-slate-400">
          CampusTest Examination Platform
        </footer>
      </div>
    );
  }

  const currentQ = test.questions[currentQIndex];
  const totalQ = test.questions.length;
  const qType = currentQ?.type || 'multiple_choice';

  const totalAnsweredCount = test.questions.reduce((count, _, idx) => {
    return isQuestionAnswered(idx) ? count + 1 : count;
  }, 0);

  const progressPercent = Math.round(((currentQIndex + 1) / totalQ) * 100);
  const isCurrentMarked = markedForReview.has(currentQIndex);

  // If question is a coding or debugging arena problem, render the dedicated Split Coding Arena interface
  const isCodingProblem = ['coding', 'debugging'].includes(qType) || ['coding', 'debugging'].includes(test?.category?.toLowerCase());

  if (isCodingProblem) {
    return (
      <>
        <CodingArenaView
          test={test}
          currentQIndex={currentQIndex}
          setCurrentQIndex={setCurrentQIndex}
          codeAnswers={codeAnswers}
          setCodeAnswers={setCodeAnswers}
          selectedLanguages={selectedLanguages}
          setSelectedLanguages={setSelectedLanguages}
          codeExecutionResults={codeExecutionResults}
          setCodeExecutionResults={setCodeExecutionResults}
          markedForReview={markedForReview}
          toggleMarkForReview={handleToggleMarkForReview}
          timeLeft={timeLeft}
          formatTime={formatTime}
          autoSaveStatus={autoSaveStatus}
          triggerAutoSave={triggerAutoSave}
          onSaveAndProceed={() => {
            if (currentQIndex < totalQ - 1) {
              setCurrentQIndex((prev) => prev + 1);
            } else {
              setIsConfirmModalOpen(true);
            }
          }}
          onSubmitExam={() => setIsConfirmModalOpen(true)}
          onNavigateHome={() => {
            if (window.confirm('Return to student dashboard? Your current code and answers are automatically saved.')) {
              navigate('/student/dashboard');
            }
          }}
        />

        {/* Confirmation Modal */}
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title="Submit Examination"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to finish and submit your coding assessment?
            </p>
            <div className="p-3 bg-slate-50 dark:bg-navy-900 rounded-lg space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span>Total Questions:</span>
                <span className="font-bold">{totalQ}</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Answered:</span>
                <span className="font-bold">{totalAnsweredCount}</span>
              </div>
              <div className="flex justify-between text-amber-600 dark:text-amber-400">
                <span>Marked for Review:</span>
                <span className="font-bold">{markedForReview.size}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Unanswered:</span>
                <span className="font-bold">{totalQ - totalAnsweredCount}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmModalOpen(false)}
              >
                Continue Test
              </Button>
              <Button
                variant="success"
                size="sm"
                isLoading={isSubmitting}
                onClick={handleSubmitTest}
              >
                Confirm & Submit
              </Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex flex-col justify-between transition-colors">
      <div>
        {/* Exam Navigation Bar */}
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-navy-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-navy-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3 truncate mr-4">
              <div className="w-8 h-8 rounded-lg bg-navy-900 dark:bg-electric-600 text-white flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="truncate">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {test.title}
                </h2>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Question {currentQIndex + 1} of {totalQ}</span>
                  <span>•</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {totalAnsweredCount} Answered
                  </span>
                  {markedForReview.size > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        {markedForReview.size} Marked for Review
                      </span>
                    </>
                  )}
                  {autoSaveStatus === 'saving' && (
                    <span className="text-[10px] text-electric-600 animate-pulse">
                      (Saving...)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 flex-shrink-0">
              {/* Countdown Timer */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold border ${
                  timeLeft <= 300
                    ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800 animate-pulse'
                    : 'bg-slate-100 text-slate-700 dark:bg-navy-800 dark:text-slate-200 border-slate-200 dark:border-navy-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTime(timeLeft)}</span>
              </div>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-800"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-navy-800" />}
              </button>

              <Button
                variant="success"
                size="sm"
                onClick={() => setIsConfirmModalOpen(true)}
              >
                Submit Exam
              </Button>
            </div>
          </div>

          {/* Micro Progress Line */}
          <div className="w-full bg-slate-100 dark:bg-navy-800 h-1">
            <div
              className="bg-electric-600 dark:bg-electric-500 h-1 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </header>

        {/* Examination Workspace */}
        <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <Card>
            <CardHeader className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-md bg-slate-100 dark:bg-navy-800">
                  {getTypeIcon(qType)}
                </span>
                <span className="text-[11px] font-bold text-electric-600 dark:text-electric-400 uppercase tracking-wider">
                  Question {currentQIndex + 1} of {totalQ} ({qType.replace(/_/g, ' ').toUpperCase()})
                </span>
                {isCurrentMarked && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 flex items-center gap-1">
                    <Bookmark className="w-3 h-3" /> Marked for Review
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Weight: {currentQ?.marks || 1} mark(s)
                </span>
                {/* Clear Answer Button */}
                <button
                  type="button"
                  onClick={handleClearAnswer}
                  className="text-xs font-semibold text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                >
                  Clear Answer
                </button>
              </div>
            </CardHeader>

            <CardBody className="space-y-6 py-6">
              <p className="text-base font-semibold text-slate-900 dark:text-white leading-relaxed">
                {currentQ?.questionText}
              </p>

              {/* 1. CODE SNIPPET for Output Prediction */}
              {qType === 'output_prediction' && currentQ?.codeSnippet && (
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
                  <pre>{currentQ.codeSnippet}</pre>
                </div>
              )}

              {/* 2. DDL SCHEMA for SQL Challenge */}
              {qType === 'sql' && currentQ?.schemaSql && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Database Schema DDL:
                  </span>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-xs text-sky-300 overflow-x-auto">
                    <pre>{currentQ.schemaSql}</pre>
                  </div>
                </div>
              )}

              {/* 3. CODE EDITOR for Coding & Debugging Arenas */}
              {['coding', 'debugging'].includes(qType) && (
                <div className="space-y-4">
                  {/* Flawed Code Banner for Debugging Arena */}
                  {qType === 'debugging' && currentQ?.buggyCode && (
                    <div className="space-y-1.5 p-3.5 bg-rose-50/70 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs">
                      <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold uppercase tracking-wider text-[11px]">
                        <Bug className="w-3.5 h-3.5" /> Reference Flawed Code (Inspect the defect below):
                      </div>
                      <pre className="p-2.5 bg-slate-950 rounded-lg text-rose-300 font-mono text-[11px] overflow-x-auto border border-rose-900/40">
                        {currentQ.buggyCode}
                      </pre>
                    </div>
                  )}

                  {/* Monaco Code Editor */}
                  <div className="space-y-2">
                    <CodeEditor
                      language={selectedLanguages[currentQIndex] || currentQ?.language || 'javascript'}
                      value={codeAnswers[currentQIndex] || ''}
                      onChange={handleCodeChange}
                      onLanguageChange={(newLang) => {
                        setSelectedLanguages((prev) => ({ ...prev, [currentQIndex]: newLang }));
                      }}
                      starterCode={currentQ?.starterCode || currentQ?.buggyCode || ''}
                      height="380px"
                    />
                  </div>

                  {/* Interactive Execution & Test Cases Panel */}
                  <CodeExecutionPanel
                    testId={id}
                    questionIndex={currentQIndex}
                    sourceCode={codeAnswers[currentQIndex] || ''}
                    language={selectedLanguages[currentQIndex] || currentQ?.language || 'javascript'}
                    testCases={currentQ?.testCases || []}
                    onSubmissionResult={(execRes) => {
                      setCodeExecutionResults((prev) => ({
                        ...prev,
                        [currentQIndex]: execRes
                      }));
                      // Construct and auto-save the evaluated state
                      const serializedCode = JSON.stringify({
                        sourceCode: codeAnswers[currentQIndex] || '',
                        language: selectedLanguages[currentQIndex] || currentQ?.language || 'javascript',
                        passedCount: execRes.passedCount,
                        totalCount: execRes.totalCount,
                        score: execRes.score,
                        maxScore: execRes.maxScore,
                        executionTime: execRes.executionTime,
                        memoryUsed: execRes.memoryUsed,
                        status: execRes.status,
                        testResults: execRes.testResults
                      });
                      triggerAutoSave({
                        questionIndex: currentQIndex,
                        selectedOption: null,
                        submittedCode: serializedCode
                      });
                    }}
                  />
                </div>
              )}

              {/* 4. SQL QUERY EDITOR for SQL Arena */}
              {qType === 'sql' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      SQL Query Editor:
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      PostgreSQL syntax
                    </span>
                  </div>
                  <CodeEditor
                    language="sql"
                    value={sqlAnswers[currentQIndex] || '-- Write your SQL query below:\n'}
                    onChange={handleSqlChange}
                    starterCode="-- Write your SQL query below:\n"
                    height="240px"
                  />
                </div>
              )}

              {/* 5. NUMERICAL ANSWER INPUT (Direct Number / Decimal) */}
              {qType === 'numerical' && (
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-navy-950 rounded-xl border border-slate-200 dark:border-navy-800">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Enter Your Numerical Value / Integer:
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={numericalAnswers[currentQIndex] !== undefined ? numericalAnswers[currentQIndex] : ''}
                    onChange={(e) => handleNumericalChange(e.target.value)}
                    placeholder="Type number (e.g. 42 or 68.57)..."
                    className="w-full sm:w-80 py-2.5 px-3.5 text-sm font-mono font-bold rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-electric-500"
                  />
                  <p className="text-[11px] text-slate-400">Use decimal numbers or integers. Round to 2 decimals if required.</p>
                </div>
              )}

              {/* 6. MULTIPLE CORRECT ANSWERS (Checkboxes) */}
              {qType === 'multiple_answers' && Array.isArray(currentQ?.options) && (
                <div className="space-y-2.5 pt-2">
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    Select all correct statements (Multiple answers may apply):
                  </p>
                  {currentQ.options.map((opt, optIndex) => {
                    const selectedList = multiAnswers[currentQIndex] || [];
                    const isSelected = selectedList.includes(optIndex);

                    return (
                      <label
                        key={optIndex}
                        onClick={() => handleToggleMultiOption(optIndex)}
                        className={`flex items-center gap-3.5 p-4 rounded-xl border text-sm font-medium cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-50/70 border-indigo-600 text-indigo-950 dark:bg-indigo-950/40 dark:border-indigo-500 dark:text-indigo-200 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'bg-white dark:bg-navy-850 border-slate-200 dark:border-navy-750 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          name={`multi-q-${currentQIndex}-${optIndex}`}
                          checked={isSelected}
                          onChange={() => handleToggleMultiOption(optIndex)}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* 7. SINGLE CHOICE RADIO (MCQ, Logical Reasoning, Quantitative, Verbal, Output Prediction) */}
              {['multiple_choice', 'logical_reasoning', 'quantitative_aptitude', 'verbal_ability', 'aptitude', 'output_prediction', 'technical'].includes(qType) &&
                Array.isArray(currentQ?.options) && currentQ.options.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  {currentQ.options.map((opt, optIndex) => {
                    const isSelected = selectedAnswers[currentQIndex] === optIndex;
                    return (
                      <label
                        key={optIndex}
                        onClick={() => handleSelectOption(optIndex)}
                        className={`flex items-center gap-3.5 p-4 rounded-xl border text-sm font-medium cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-electric-50/70 border-electric-600 text-electric-950 dark:bg-electric-950/40 dark:border-electric-500 dark:text-electric-200 ring-2 ring-electric-500/20 shadow-xs'
                            : 'bg-white dark:bg-navy-850 border-slate-200 dark:border-navy-750 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${currentQIndex}`}
                          checked={isSelected}
                          onChange={() => handleSelectOption(optIndex)}
                          className="w-4 h-4 text-electric-600 focus:ring-electric-500 cursor-pointer"
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </CardBody>

            <CardFooter className="flex flex-wrap items-center justify-between gap-3 py-3.5">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                  icon={ArrowLeft}
                >
                  Previous
                </Button>

                {/* Mark for Review Button */}
                <Button
                  variant={isCurrentMarked ? 'warning' : 'outline'}
                  size="sm"
                  onClick={handleToggleMarkForReview}
                  className="text-xs flex items-center gap-1.5"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{isCurrentMarked ? 'Marked for Review' : 'Mark for Review'}</span>
                </Button>
              </div>

              {/* Question Navigation Palette */}
              <div className="flex gap-1.5 overflow-x-auto max-w-[200px] sm:max-w-xs px-2 py-1">
                {test.questions.map((_, idx) => {
                  const isAnswered = isQuestionAnswered(idx);
                  const isMarked = markedForReview.has(idx);

                  let btnClass = 'bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-400';
                  if (currentQIndex === idx) {
                    btnClass = 'bg-electric-600 text-white shadow-xs ring-2 ring-electric-500/30';
                  } else if (isMarked && isAnswered) {
                    btnClass = 'bg-purple-100 text-purple-900 border border-purple-400 dark:bg-purple-950/80 dark:text-purple-300';
                  } else if (isMarked) {
                    btnClass = 'bg-amber-100 text-amber-900 border border-amber-400 dark:bg-amber-950/80 dark:text-amber-300';
                  } else if (isAnswered) {
                    btnClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentQIndex(idx)}
                      className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all ${btnClass}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="primary"
                size="sm"
                disabled={currentQIndex === totalQ - 1}
                onClick={() => setCurrentQIndex((prev) => Math.min(totalQ - 1, prev + 1))}
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Submit Examination"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Are you sure you want to finish and submit your assessment?
          </p>
          <div className="p-3 bg-slate-50 dark:bg-navy-900 rounded-lg space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span>Total Questions:</span>
              <span className="font-bold">{totalQ}</span>
            </div>
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Answered:</span>
              <span className="font-bold">{totalAnsweredCount}</span>
            </div>
            <div className="flex justify-between text-amber-600 dark:text-amber-400">
              <span>Marked for Review:</span>
              <span className="font-bold">{markedForReview.size}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Unanswered:</span>
              <span className="font-bold">{totalQ - totalAnsweredCount}</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmModalOpen(false)}
            >
              Continue Test
            </Button>
            <Button
              variant="success"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleSubmitTest}
            >
              Confirm & Submit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TakeTest;
