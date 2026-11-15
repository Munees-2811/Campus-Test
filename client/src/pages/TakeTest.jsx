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
  Check
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
  const [selectedAnswers, setSelectedAnswers] = useState({});
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

  const handleSubmitTest = async () => {
    try {
      setIsSubmitting(true);
      setIsConfirmModalOpen(false);

      const formattedAnswers = Object.entries(selectedAnswers).map(([qIdx, optIdx]) => ({
        questionIndex: Number(qIdx),
        selectedOption: optIdx
      }));

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
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex flex-col justify-between transition-colors">
        {/* Simple Header */}
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
                  submissionResult.passed
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                }`}
              >
                <Award className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Assessment Completed
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your evaluation has been graded and recorded in Supabase.
                </p>
              </div>

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
  const answeredCount = Object.keys(selectedAnswers).length;
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
                  Question {currentQIndex + 1} of {totalQ} • {answeredCount} Answered
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
              <span className="text-[11px] font-bold text-electric-600 dark:text-electric-400 uppercase tracking-wider">
                Question {currentQIndex + 1} of {totalQ}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Weight: {currentQ?.marks || 1} mark(s)
              </span>
            </CardHeader>

            <CardBody className="space-y-6 py-6">
              <p className="text-base font-semibold text-slate-900 dark:text-white leading-relaxed">
                {currentQ?.questionText}
              </p>

              <div className="space-y-2.5 pt-2">
                {currentQ?.options?.map((opt, optIndex) => {
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
                    onClick={() => setCurrentQIndex(idx)}
                    className={`w-7 h-7 text-xs rounded-lg font-semibold flex items-center justify-center transition-colors ${
                      currentQIndex === idx
                        ? 'bg-electric-600 text-white'
                        : selectedAnswers[idx] !== undefined
                        ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-navy-750'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              {currentQIndex < totalQ - 1 ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setCurrentQIndex((prev) => Math.min(totalQ - 1, prev + 1))}
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              ) : (
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => setIsConfirmModalOpen(true)}
                >
                  Finish
                </Button>
              )}
            </CardFooter>
          </Card>
        </main>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Submit Assessment"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            You have completed <strong className="text-slate-900 dark:text-white">{answeredCount}</strong> of{' '}
            <strong className="text-slate-900 dark:text-white">{totalQ}</strong> questions.
          </p>
          {answeredCount < totalQ && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>You have {totalQ - answeredCount} unanswered questions remaining.</span>
            </div>
          )}
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Once submitted, your responses are finalized and instantly graded by the backend.
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-navy-800">
            <Button
              variant="secondary"
              onClick={() => setIsConfirmModalOpen(false)}
            >
              Resume Exam
            </Button>
            <Button
              variant="success"
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
