import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card, { CardBody, CardFooter, CardHeader } from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import { useTheme } from '../context/ThemeContext';
import testService from '../services/testService';
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
  Play
} from 'lucide-react';

const TakeTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Test state
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [qIdx]: optionIdx }
  const [codeAnswers, setCodeAnswers] = useState({}); // { [qIdx]: codeString }
  const [sqlAnswers, setSqlAnswers] = useState({}); // { [qIdx]: sqlQueryString }
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Result state after submission
  const [submissionResult, setSubmissionResult] = useState(null);

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

          // Prepopulate starter code
          const initialCode = {};
          const initialSql = {};
          (data.test.questions || []).forEach((q, idx) => {
            if (q.type === 'coding' && q.starterCode) {
              initialCode[idx] = q.starterCode;
            } else if (q.type === 'debugging' && q.buggyCode) {
              initialCode[idx] = q.buggyCode;
            } else if (q.type === 'sql' && q.expectedQuery) {
              initialSql[idx] = '-- Write your SQL query below:\n';
            }
          });
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

  // Countdown timer
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

  const handleSelectOption = (optIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQIndex]: optIndex
    });
  };

  const handleCodeChange = (code) => {
    setCodeAnswers({
      ...codeAnswers,
      [currentQIndex]: code
    });
  };

  const handleSqlChange = (query) => {
    setSqlAnswers({
      ...sqlAnswers,
      [currentQIndex]: query
    });
  };

  const handleSubmitTest = async () => {
    try {
      setIsSubmitting(true);
      setIsConfirmModalOpen(false);

      const questions = test.questions || [];
      const formattedAnswers = questions.map((q, idx) => {
        const item = {
          questionIndex: idx,
          selectedOption: selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : null,
          submittedCode: codeAnswers[idx] || sqlAnswers[idx] || null
        };
        return item;
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
      case 'coding': return <Code2 className="w-3.5 h-3.5 text-blue-500" />;
      case 'debugging': return <Bug className="w-3.5 h-3.5 text-rose-500" />;
      case 'sql': return <Database className="w-3.5 h-3.5 text-emerald-500" />;
      case 'aptitude': return <Brain className="w-3.5 h-3.5 text-amber-500" />;
      case 'output_prediction': return <Terminal className="w-3.5 h-3.5 text-purple-500" />;
      default: return <Cpu className="w-3.5 h-3.5 text-electric-500" />;
    }
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
                    ? 'Your evaluation has been graded and recorded in Supabase.'
                    : 'Your answers have been submitted. Scores will be released on the scheduled release date.'}
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
                  Official results will be announced: <strong>{submissionResult.releaseDate ? new Date(submissionResult.releaseDate).toLocaleString() : 'Soon'}</strong>
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
  const answeredCount = Object.keys(selectedAnswers).length + Object.keys(codeAnswers).length;
  const progressPercent = Math.round(((currentQIndex + 1) / totalQ) * 100);

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
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Question {currentQIndex + 1} of {totalQ} • {answeredCount} Completed
                </p>
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
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-md bg-slate-100 dark:bg-navy-800">
                  {getTypeIcon(qType)}
                </span>
                <span className="text-[11px] font-bold text-electric-600 dark:text-electric-400 uppercase tracking-wider">
                  Question {currentQIndex + 1} of {totalQ} ({qType.replace('_', ' ').toUpperCase()})
                </span>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Weight: {currentQ?.marks || 1} mark(s)
              </span>
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
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Code Editor ({currentQ?.language || 'JavaScript'}):
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {qType === 'debugging' ? 'Fix flawed implementation' : 'Complete algorithm solution'}
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={codeAnswers[currentQIndex] || ''}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    className="w-full font-mono text-xs p-4 rounded-xl border border-slate-300 dark:border-navy-700 bg-slate-950 text-blue-300 focus:outline-none focus:ring-2 focus:ring-electric-500"
                    placeholder="// Write your code solution here..."
                  />

                  {/* Sample Test Cases Display */}
                  {Array.isArray(currentQ?.testCases) && currentQ.testCases.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Sample Test Cases:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {currentQ.testCases.map((tc, tcIdx) => (
                          <div key={tcIdx} className="p-2.5 rounded-lg bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-800 font-mono text-[11px] space-y-1">
                            <div><span className="text-slate-400">Input:</span> {tc.input}</div>
                            <div><span className="text-slate-400">Expected:</span> <span className="text-emerald-600 dark:text-emerald-400 font-bold">{tc.expectedOutput}</span></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 4. SQL QUERY EDITOR for SQL Arena */}
              {qType === 'sql' && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Write SQL Query:
                  </span>
                  <textarea
                    rows={4}
                    value={sqlAnswers[currentQIndex] || ''}
                    onChange={(e) => handleSqlChange(e.target.value)}
                    className="w-full font-mono text-xs p-3 rounded-xl border border-slate-300 dark:border-navy-700 bg-slate-950 text-amber-300 focus:outline-none focus:ring-2 focus:ring-electric-500"
                    placeholder="SELECT ... FROM ... WHERE ...;"
                  />
                </div>
              )}

              {/* 5. MULTIPLE CHOICE OPTIONS (Technical MCQ, Aptitude, Output Prediction, or SQL Multiple Choice) */}
              {Array.isArray(currentQ?.options) && currentQ.options.length > 0 && (
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

            <CardFooter className="flex items-center justify-between py-3.5">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                icon={ArrowLeft}
              >
                Previous
              </Button>

              {/* Question Navigation Palette */}
              <div className="flex gap-1.5 overflow-x-auto max-w-[220px] sm:max-w-xs px-2 py-1">
                {test.questions.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentQIndex(idx)}
                    className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all ${
                      currentQIndex === idx
                        ? 'bg-electric-600 text-white shadow-xs'
                        : selectedAnswers[idx] !== undefined || codeAnswers[idx]
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
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
            Are you sure you want to finish and submit your assessment? You have completed{' '}
            <strong>{answeredCount}</strong> of <strong>{totalQ}</strong> questions.
          </p>
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
