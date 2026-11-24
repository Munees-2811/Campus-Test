import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../../context/ThemeContext';
import Button from '../common/Button';
import Badge from '../common/Badge';
import testService from '../../services/testService';
import {
  Clock,
  Play,
  Send,
  RotateCcw,
  Maximize2,
  Minimize2,
  Bookmark,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Terminal,
  Cpu,
  Layers,
  GraduationCap,
  Settings,
  HelpCircle,
  Sun,
  Moon,
  Columns,
  EyeOff,
  Code2,
  Bug,
  Info,
  Check,
  FileCode,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const LANGUAGE_CONFIGS = [
  { id: 'cpp', label: 'C++20 (GCC)', monaco: 'cpp', starter: '// C++ Solution\n#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}' },
  { id: 'c', label: 'C (GCC)', monaco: 'c', starter: '// C Solution\n#include <stdio.h>\n\nint main() {\n    // Write your code here\n    return 0;\n}' },
  { id: 'java', label: 'Java 17 (OpenJDK)', monaco: 'java', starter: '// Java Solution\nimport java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}' },
  { id: 'python', label: 'Python 3', monaco: 'python', starter: '# Python 3 Solution\nimport sys\n\ndef main():\n    # Write your code here\n    pass\n\nif __name__ == "__main__":\n    main()' },
  { id: 'javascript', label: 'JavaScript (Node.js)', monaco: 'javascript', starter: '// JavaScript Solution\nfunction solution() {\n    // Write your code here\n}\n\nsolution();' }
];

export const CodingArenaView = ({
  test,
  currentQIndex,
  setCurrentQIndex,
  codeAnswers,
  setCodeAnswers,
  selectedLanguages,
  setSelectedLanguages,
  codeExecutionResults,
  setCodeExecutionResults,
  markedForReview,
  toggleMarkForReview,
  timeLeft,
  formatTime,
  onSaveAndProceed,
  onSubmitExam,
  onNavigateHome,
  autoSaveStatus,
  triggerAutoSave
}) => {
  const { theme, toggleTheme } = useTheme();

  // Current question data
  const currentQ = test?.questions?.[currentQIndex] || {};
  const totalQuestions = test?.questions?.length || 1;
  const isMarked = markedForReview.has(currentQIndex);

  // Layout & View State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState('testcases'); // 'testcases' | 'custom' | 'results'
  const [customInput, setCustomInput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Execution State
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [customRunOutput, setCustomRunOutput] = useState(null);
  const [runError, setRunError] = useState('');

  // Editor Cursor State
  const [editorCursor, setEditorCursor] = useState({ line: 1, col: 1 });
  const editorRef = useRef(null);

  // Active language for this question
  const currentLangId = selectedLanguages[currentQIndex] || currentQ.language || 'cpp';
  const currentLangConfig = LANGUAGE_CONFIGS.find((l) => l.id === currentLangId) || LANGUAGE_CONFIGS[0];

  // Current code
  const currentCode = codeAnswers[currentQIndex] !== undefined
    ? codeAnswers[currentQIndex]
    : currentQ.starterCode || currentQ.buggyCode || currentLangConfig.starter;

  // Active execution result for this question
  const activeResult = codeExecutionResults[currentQIndex];

  // Public test cases
  const publicTestCases = Array.isArray(currentQ.testCases)
    ? currentQ.testCases.filter((tc) => !tc.isHidden)
    : [];

  const handleLanguageChange = (newLangId) => {
    setSelectedLanguages((prev) => ({ ...prev, [currentQIndex]: newLangId }));
    const newConfig = LANGUAGE_CONFIGS.find((l) => l.id === newLangId);
    if (newConfig && (!currentCode || currentCode === currentLangConfig.starter)) {
      setCodeAnswers((prev) => ({ ...prev, [currentQIndex]: newConfig.starter }));
    }
  };

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
    editor.onDidChangeCursorPosition((e) => {
      setEditorCursor({ line: e.position.lineNumber, col: e.position.column });
    });
  };

  const handleResetCode = () => {
    const starter = currentQ.starterCode || currentQ.buggyCode || currentLangConfig.starter;
    if (window.confirm('Reset code to the original problem template? Any unsaved edits will be lost.')) {
      setCodeAnswers((prev) => ({ ...prev, [currentQIndex]: starter }));
      triggerAutoSave({
        questionIndex: currentQIndex,
        selectedOption: null,
        submittedCode: starter
      });
    }
  };

  // Run Code against sample test cases or custom stdin
  const handleRunCode = async () => {
    if (!currentCode || !currentCode.trim()) {
      setRunError('Please enter code before running.');
      return;
    }

    try {
      setIsRunning(true);
      setRunError('');
      setIsDrawerOpen(true);

      if (drawerTab === 'custom') {
        const res = await testService.runCode({
          sourceCode: currentCode,
          language: currentLangId,
          stdin: customInput
        });
        if (res.success && res.output) {
          setCustomRunOutput(res.output);
        }
      } else {
        const res = await testService.submitCode({
          testId: test.id || test._id,
          questionIndex: currentQIndex,
          sourceCode: currentCode,
          language: currentLangId
        });

        if (res.success && res.result) {
          setCodeExecutionResults((prev) => ({ ...prev, [currentQIndex]: res.result }));
          setDrawerTab('testcases');
        }
      }
    } catch (err) {
      setRunError(err.message || 'Execution failed. Please check your syntax.');
    } finally {
      setIsRunning(false);
    }
  };

  // Submit Code against public & hidden test cases
  const handleSubmitCode = async () => {
    if (!currentCode || !currentCode.trim()) {
      setRunError('Please write code before submitting.');
      return;
    }

    try {
      setIsSubmittingCode(true);
      setRunError('');
      setIsDrawerOpen(true);

      const res = await testService.submitCode({
        testId: test.id || test._id,
        questionIndex: currentQIndex,
        sourceCode: currentCode,
        language: currentLangId
      });

      if (res.success && res.result) {
        setCodeExecutionResults((prev) => ({ ...prev, [currentQIndex]: res.result }));
        setDrawerTab('results');

        const serialized = JSON.stringify({
          sourceCode: currentCode,
          language: currentLangId,
          passedCount: res.result.passedCount,
          totalCount: res.result.totalCount,
          score: res.result.score,
          maxScore: res.result.maxScore,
          executionTime: res.result.executionTime,
          memoryUsed: res.result.memoryUsed,
          status: res.result.status,
          testResults: res.result.testResults
        });

        triggerAutoSave({
          questionIndex: currentQIndex,
          selectedOption: null,
          submittedCode: serialized
        });
      }
    } catch (err) {
      setRunError(err.message || 'Evaluation submission failed.');
    } finally {
      setIsSubmittingCode(false);
    }
  };

  const isLastQuestion = currentQIndex === totalQuestions - 1;

  // Question Answered Count
  const answeredCount = test?.questions?.reduce((count, _, idx) => {
    return (codeAnswers[idx] && codeAnswers[idx].trim().length > 10) || codeExecutionResults[idx] ? count + 1 : count;
  }, 0) || 0;

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 font-sans transition-colors">
      {/* ─── 1. TOP NAVBAR (CampusTest Design Language) ─────────────── */}
      <header className="h-16 bg-white/95 dark:bg-navy-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-navy-800 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-30">
        <div className="flex items-center space-x-3 truncate mr-4">
          <div className="w-8 h-8 rounded-lg bg-navy-900 dark:bg-electric-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {test?.title || 'Coding Arena'}
              </h2>
              <Badge variant="primary" size="sm">
                Coding Arena
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span>Problem {currentQIndex + 1} of {totalQuestions}</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {answeredCount} Completed
              </span>
              {markedForReview.size > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    {markedForReview.size} Review
                  </span>
                </>
              )}
              {autoSaveStatus === 'saving' && (
                <span className="text-[10px] text-electric-600 dark:text-electric-400 animate-pulse font-mono">
                  (Saving...)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Nav Action Controls */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          {/* Countdown Timer Pill */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold border transition-colors ${
              timeLeft <= 300
                ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800 animate-pulse'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-navy-800" />}
          </button>

          {/* Help Instructions */}
          <button
            type="button"
            onClick={() => setIsHelpOpen(!isHelpOpen)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
            title="Shortcuts and guidelines"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Save & Proceed / Submit Exam Button */}
          <Button
            variant="success"
            size="sm"
            onClick={onSaveAndProceed}
            className="font-bold shadow-sm"
          >
            <span>{isLastQuestion ? 'Review & Submit' : 'Save & Proceed'}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </header>

      {/* ─── 2. MAIN SPLIT ARENA BODY ─────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* 2A. LEFT NAVIGATION RAIL (Mini Icon Column) */}
        <div className="w-12 bg-slate-100/90 dark:bg-navy-950 border-r border-slate-200 dark:border-navy-800 flex flex-col items-center justify-between py-3 flex-shrink-0 z-20 transition-colors">
          <div className="flex flex-col items-center gap-3">
            {/* Toggle Problem Roster */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-lg transition-colors ${
                isSidebarOpen
                  ? 'bg-electric-50 text-electric-600 dark:bg-electric-950/60 dark:text-electric-400'
                  : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-navy-850'
              }`}
              title="Toggle problem list"
            >
              <FileCode className="w-4 h-4" />
            </button>

            {/* Test Home button */}
            <button
              type="button"
              onClick={onNavigateHome}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-navy-850 transition-colors"
              title="Return to Student Portal"
            >
              <GraduationCap className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Settings className="w-4 h-4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200" />
          </div>
        </div>

        {/* 2B. QUESTION ROSTER SIDEBAR (Collapsible) */}
        {isSidebarOpen && (
          <aside className="w-60 bg-white dark:bg-navy-900 border-r border-slate-200 dark:border-navy-800 flex flex-col flex-shrink-0 select-none transition-colors">
            <div className="p-3.5 border-b border-slate-200 dark:border-navy-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Programming Problems ({totalQuestions})
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {test?.questions?.map((q, idx) => {
                const isActive = currentQIndex === idx;
                const isAnswered = (codeAnswers[idx] && codeAnswers[idx].trim().length > 15) || codeExecutionResults[idx];
                const isQMarked = markedForReview.has(idx);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentQIndex(idx)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start gap-2.5 ${
                      isActive
                        ? 'bg-electric-50 text-electric-900 border border-electric-200 dark:bg-electric-950/60 dark:text-electric-200 dark:border-electric-800 font-semibold shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-navy-850/60 border border-transparent'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs flex-shrink-0 font-bold ${
                        isActive
                          ? 'bg-electric-600 text-white'
                          : isAnswered
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="truncate flex-1">
                      <div className="truncate font-semibold text-slate-900 dark:text-white leading-snug">
                        {q.questionText ? q.questionText.split('\n')[0].substring(0, 30) : `Problem #${idx + 1}`}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                        <span>{q.marks || 10} marks</span>
                        {isQMarked && <span className="text-amber-500 font-bold">• Review</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-navy-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Marked for review:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{markedForReview.size}</span>
            </div>
          </aside>
        )}

        {/* 2C. CENTER-LEFT: PROBLEM STATEMENT DESCRIPTION PANEL */}
        <section className="w-1/2 flex-1 border-r border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 overflow-y-auto flex flex-col transition-colors">
          {/* Problem Header Bar */}
          <div className="p-5 border-b border-slate-200 dark:border-navy-800 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={toggleMarkForReview}
                  className={`p-2 rounded-lg border transition-colors ${
                    isMarked
                      ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700'
                      : 'border-slate-200 dark:border-navy-750 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                  title={isMarked ? 'Unmark question' : 'Mark for review'}
                >
                  <Bookmark className="w-4 h-4" />
                </button>
                <div>
                  <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    {currentQ.questionText ? currentQ.questionText.split('\n')[0] : `Problem ${currentQIndex + 1}`}
                  </h1>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Question {currentQIndex + 1} of {totalQuestions}
                  </span>
                </div>
              </div>

              <Badge variant="primary" size="md">
                Weight: {currentQ.marks || 10} marks
              </Badge>
            </div>

            {currentQ.type === 'debugging' && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                <Bug className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>Debugging Arena: Locate and fix logic defects in the implementation below.</span>
              </div>
            )}
          </div>

          {/* Problem Statement Prose */}
          <div className="p-6 space-y-6 text-slate-700 dark:text-slate-300 text-sm leading-relaxed overflow-y-auto flex-1 font-sans">
            {/* Prompt Description */}
            <div className="whitespace-pre-wrap space-y-3 font-normal text-slate-800 dark:text-slate-200">
              {currentQ.questionText || 'Complete the algorithm according to specifications.'}
            </div>

            {/* Reference Buggy Code for Debugging Arena */}
            {currentQ.type === 'debugging' && currentQ.buggyCode && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 font-mono">
                  Defective Reference Implementation:
                </span>
                <pre className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-rose-300 overflow-x-auto">
                  {currentQ.buggyCode}
                </pre>
              </div>
            )}

            {/* Examples Section */}
            {publicTestCases.length > 0 && (
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Sample Test Cases
                </h3>

                {publicTestCases.map((tc, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-2 font-mono text-xs"
                  >
                    <div className="font-bold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wide">
                      Example {idx + 1}
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Input:</span>
                      <pre className="text-slate-800 dark:text-slate-200 bg-white dark:bg-navy-900 p-2 rounded-lg border border-slate-200 dark:border-navy-800 overflow-x-auto text-xs mt-0.5">
                        {tc.input || '(empty input)'}
                      </pre>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Expected Output:</span>
                      <pre className="text-emerald-600 dark:text-emerald-400 bg-white dark:bg-navy-900 p-2 rounded-lg border border-slate-200 dark:border-navy-800 overflow-x-auto text-xs font-bold mt-0.5">
                        {tc.expectedOutput}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Constraints & Environment Section */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-navy-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Environment & Constraints
              </h3>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                <li>Time Limit: 5.0 seconds per test case</li>
                <li>Memory Limit: 256 MB</li>
                <li>Standard I/O: Read from standard input (cin/stdin), write to standard output (cout/stdout)</li>
                {currentQ.explanation && <li>Notes: {currentQ.explanation}</li>}
              </ul>
            </div>
          </div>
        </section>

        {/* 2D. RIGHT PANEL: MONACO CODE EDITOR & DRAWER */}
        <section className="w-1/2 flex-1 bg-white dark:bg-navy-900 flex flex-col overflow-hidden relative transition-colors">
          {/* Editor Header Toolbar */}
          <div className="h-11 bg-slate-50 dark:bg-navy-950 border-b border-slate-200 dark:border-navy-800 px-4 flex items-center justify-between text-xs flex-shrink-0">
            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-400 font-semibold text-xs">Language:</span>
              <select
                value={currentLangId}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="py-1 px-3 rounded-lg bg-white dark:bg-navy-850 border border-slate-200 dark:border-navy-700 text-slate-800 dark:text-slate-200 font-mono text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-electric-500 shadow-xs"
              >
                {LANGUAGE_CONFIGS.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.label}
                  </option>
                ))}
              </select>
              <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-slate-600" title="GCC 9.2 / Node 18 / OpenJDK 17" />
            </div>

            {/* Editor Action Icons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleResetCode}
                className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-navy-800 transition-colors"
                title="Reset to starter template"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-navy-800 transition-colors"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen editor'}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Monaco Editor Canvas */}
          <div className="flex-1 w-full overflow-hidden relative">
            <Editor
              height="100%"
              language={currentLangConfig.monaco}
              value={currentCode}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              onChange={(newVal) => {
                const codeStr = newVal || '';
                setCodeAnswers((prev) => ({ ...prev, [currentQIndex]: codeStr }));
                triggerAutoSave({
                  questionIndex: currentQIndex,
                  selectedOption: null,
                  submittedCode: codeStr
                });
              }}
              onMount={handleEditorMount}
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                minimap: { enabled: false },
                automaticLayout: true,
                scrollBeyondLastLine: false,
                tabSize: 4,
                wordWrap: 'on',
                lineNumbers: 'on',
                roundedSelection: true,
                cursorBlinking: 'smooth',
                formatOnPaste: true,
                renderWhitespace: 'none',
                lineDecorationsWidth: 6,
                lineNumbersMinChars: 3
              }}
              loading={
                <div className="h-full flex items-center justify-center p-8 bg-slate-50 dark:bg-navy-950 text-slate-400 font-mono text-xs">
                  Loading Monaco Code Editor...
                </div>
              }
            />
          </div>

          {/* Editor Status Bar Footer */}
          <div className="h-6 bg-slate-100 dark:bg-navy-950 border-t border-slate-200 dark:border-navy-800 px-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono flex-shrink-0">
            <div className="flex items-center gap-3">
              <span>Ln {editorCursor.line}, Col {editorCursor.col}</span>
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Autocomplete
              </span>
              <span>Spaces: 4</span>
              <span>Mode: Normal</span>
            </div>
            <div>
              <span className="uppercase font-semibold text-electric-600 dark:text-electric-400">
                {currentLangConfig.id}
              </span>
            </div>
          </div>

          {/* ─── 2E. BOTTOM DRAWER: TEST RESULTS & CONSOLE ───────────── */}
          <div
            className={`bg-white dark:bg-navy-900 border-t border-slate-200 dark:border-navy-800 transition-all duration-200 flex flex-col flex-shrink-0 z-20 ${
              isDrawerOpen ? 'h-64' : 'h-12'
            }`}
          >
            {/* Drawer Control Header */}
            <div className="h-12 px-4 flex items-center justify-between border-b border-slate-200 dark:border-navy-800 bg-slate-50/80 dark:bg-navy-950/80 flex-shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {isDrawerOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  <span>Test Results</span>
                </button>

                {/* Score summary badge if evaluated */}
                {activeResult && (
                  <Badge
                    variant={activeResult.passed ? 'success' : 'danger'}
                    size="sm"
                    className="ml-2"
                  >
                    {activeResult.passedCount} / {activeResult.totalCount} Passed
                  </Badge>
                )}
              </div>

              {/* Action Buttons: Run Code & Submit Code */}
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRunCode}
                  isLoading={isRunning}
                  icon={Play}
                  className="text-xs"
                >
                  Run Code
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSubmitCode}
                  isLoading={isSubmittingCode}
                  icon={Send}
                  className="text-xs"
                >
                  Submit Code
                </Button>
              </div>
            </div>

            {/* Drawer Body (Visible when expanded) */}
            {isDrawerOpen && (
              <div className="flex-1 flex flex-col overflow-hidden p-3 space-y-2 bg-slate-50/50 dark:bg-navy-950/50">
                {/* Tabs */}
                <div className="flex items-center gap-2 text-xs border-b border-slate-200 dark:border-navy-800 pb-1.5">
                  <button
                    type="button"
                    onClick={() => setDrawerTab('testcases')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      drawerTab === 'testcases'
                        ? 'bg-white dark:bg-navy-800 text-electric-600 dark:text-electric-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Test Cases
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawerTab('custom')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      drawerTab === 'custom'
                        ? 'bg-white dark:bg-navy-800 text-electric-600 dark:text-electric-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Custom Input
                  </button>
                  {activeResult && (
                    <button
                      type="button"
                      onClick={() => setDrawerTab('results')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        drawerTab === 'results'
                          ? 'bg-white dark:bg-navy-800 text-electric-600 dark:text-electric-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Evaluation Breakdown
                    </button>
                  )}
                </div>

                {/* Error Banner */}
                {runError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{runError}</span>
                  </div>
                )}

                {/* Tab 1: Test Cases Tab */}
                {drawerTab === 'testcases' && (
                  <div className="flex-1 overflow-y-auto space-y-2">
                    {activeResult?.testResults && activeResult.testResults.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activeResult.testResults.map((tr, idx) => (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-xl border text-xs font-mono space-y-1 ${
                              tr.passed
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                                : 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold flex items-center gap-1.5">
                                {tr.passed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-rose-500" />}
                                Case {idx + 1} {tr.isHidden ? '(Hidden)' : ''}
                              </span>
                              <Badge variant={tr.passed ? 'success' : 'danger'} size="sm">
                                {tr.passed ? 'Passed' : tr.status || 'Failed'}
                              </Badge>
                            </div>
                            {!tr.isHidden ? (
                              <div className="text-[11px] space-y-0.5 text-slate-700 dark:text-slate-300">
                                <div><span className="text-slate-400">Output:</span> {tr.actualOutput || '(none)'}</div>
                                <div><span className="text-slate-400">Expected:</span> {tr.expectedOutput}</div>
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400 italic">Confidential test verification</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-slate-400 font-mono text-xs">
                        Click <strong>Run Code</strong> to execute your solution against sample test cases.
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Custom Input Tab */}
                {drawerTab === 'custom' && (
                  <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs">
                    <textarea
                      rows={2}
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Type custom standard input (stdin) arguments here..."
                      className="w-full p-2.5 rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-750 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-electric-500"
                    />

                    {customRunOutput && (
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 space-y-1">
                        <div className="text-[10px] text-slate-400 font-bold uppercase flex justify-between">
                          <span>Output ({customRunOutput.time}s, {customRunOutput.memory}KB)</span>
                          <span className="text-emerald-400">{customRunOutput.status?.description}</span>
                        </div>
                        {customRunOutput.stdout && <pre className="text-emerald-400 text-xs">{customRunOutput.stdout}</pre>}
                        {customRunOutput.stderr && <pre className="text-rose-400 text-xs">{customRunOutput.stderr}</pre>}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 3: Detailed Breakdown */}
                {drawerTab === 'results' && activeResult && (
                  <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-xs">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{activeResult.status}</div>
                        <div className="text-[11px] text-slate-500">Marks Awarded: {activeResult.score} / {activeResult.maxScore} marks</div>
                      </div>
                      <div className="text-right text-[11px] text-slate-400">
                        <div>Peak Time: {activeResult.executionTime}s</div>
                        <div>Peak Memory: {activeResult.memoryUsed} KB</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ─── 3. HELP MODAL (CampusTest Theme) ────────────────────────── */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 space-y-4 text-xs font-sans shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-electric-600 dark:text-electric-400" />
              Coding Arena Guidelines
            </h3>
            <ul className="space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed">
              <li>• <strong>Run Code</strong>: Tests your program against standard sample test cases without official scoring.</li>
              <li>• <strong>Submit Code</strong>: Evaluates your code against all public and hidden test cases and records marks in Supabase.</li>
              <li>• <strong>Save & Proceed</strong>: Saves your progress and navigates to the next question.</li>
              <li>• <strong>Languages Supported</strong>: C, C++, Java 17, Python 3, and JavaScript (Node.js).</li>
            </ul>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => setIsHelpOpen(false)}
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodingArenaView;
