import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../../context/ThemeContext';
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
  Columns,
  Home,
  List,
  Settings,
  HelpCircle,
  Sun,
  Moon,
  Info,
  Bug,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const LANGUAGE_CONFIGS = [
  { id: 'cpp', label: 'C++23', monaco: 'cpp', starter: '// C++ Solution\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}' },
  { id: 'c', label: 'C (GCC)', monaco: 'c', starter: '// C Solution\n#include <stdio.h>\n\nint main() {\n    // Write your code here\n    return 0;\n}' },
  { id: 'java', label: 'Java 17', monaco: 'java', starter: '// Java Solution\nimport java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}' },
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
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

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

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.onDidChangeCursorPosition((e) => {
      setEditorCursor({ line: e.position.lineNumber, col: e.position.column });
    });

    // Define sleek dark theme matching #0e1117
    monaco.editor.defineTheme('arenaDark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff7b72' },
        { token: 'string', foreground: 'a5d6ff' },
        { token: 'number', foreground: '79c0ff' },
        { token: 'type', foreground: 'ffa657' }
      ],
      colors: {
        'editor.background': '#0e1117',
        'editor.foreground': '#c9d1d9',
        'editor.lineHighlightBackground': '#161b22',
        'editorLineNumber.foreground': '#484f58',
        'editorLineNumber.activeForeground': '#c9d1d9',
        'editorGutter.background': '#0e1117',
        'editorCursor.foreground': '#00ea64'
      }
    });
    monaco.editor.setTheme('arenaDark');
  };

  const handleResetCode = () => {
    const starter = currentQ.starterCode || currentQ.buggyCode || currentLangConfig.starter;
    setCodeAnswers((prev) => ({ ...prev, [currentQIndex]: starter }));
    triggerAutoSave({
      questionIndex: currentQIndex,
      selectedOption: null,
      submittedCode: starter
    });
    setResetConfirmOpen(false);
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

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#0e1117] text-[#c9d1d9] font-sans select-none">
      {/* ─── 1. TOP NAVBAR (Matching Reference Screenshot) ─────────────── */}
      <header className="h-14 bg-[#0e1117] border-b border-[#21262d] px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-30">
        <div className="flex items-center space-x-4">
          {/* Brand "H" Green Bordered Box Icon */}
          <div className="w-7 h-7 rounded border border-[#00ea64] text-[#00ea64] flex items-center justify-center font-bold text-sm bg-transparent shadow-xs">
            H
          </div>

          {/* Countdown Timer Pill (Green Outline Pill) */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-semibold border border-[#00ea64]/60 bg-[#00ea64]/10 text-[#00ea64]">
            <Clock className="w-3.5 h-3.5 text-[#00ea64]" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          {autoSaveStatus === 'saving' && (
            <span className="text-[11px] text-[#00ea64] font-mono animate-pulse">
              Saving...
            </span>
          )}
        </div>

        {/* Right Nav Action Controls */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          {/* Layout Toggle */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-white border border-[#30363d] hover:border-slate-500 rounded bg-transparent transition-colors"
            title="Toggle Problem Sidebar Layout"
          >
            <span>Layout</span>
            <Columns className="w-3.5 h-3.5" />
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 text-slate-400 hover:text-white transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Help Instructions */}
          <button
            type="button"
            onClick={() => setIsHelpOpen(!isHelpOpen)}
            className="p-1.5 text-slate-400 hover:text-white transition-colors"
            title="Shortcuts and guidelines"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Green Save & Proceed Button */}
          <button
            type="button"
            onClick={onSaveAndProceed}
            className="bg-[#00ea64] hover:bg-[#00d257] active:bg-[#00be4e] text-black font-bold px-4 py-1.5 rounded-md text-xs shadow-xs transition-colors flex items-center gap-1"
          >
            <span>{isLastQuestion ? 'Review & Submit' : 'Save & Proceed'}</span>
          </button>
        </div>
      </header>

      {/* ─── 2. MAIN SPLIT ARENA BODY ─────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* 2A. LEFT NAVIGATION RAIL (Mini Icon Strip) */}
        <div className="w-14 bg-[#0e1117] border-r border-[#21262d] flex flex-col items-center justify-between py-3 flex-shrink-0 z-20">
          <div className="flex flex-col items-center gap-4 w-full">
            {/* Sidebar toggle icon */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 text-slate-400 hover:text-white transition-colors"
              title="Toggle question roster"
            >
              <Columns className="w-4 h-4" />
            </button>

            {/* Test home button with border */}
            <button
              type="button"
              onClick={onNavigateHome}
              className="flex items-center gap-1 px-1.5 py-1 rounded border border-[#30363d] text-slate-300 hover:text-white hover:border-slate-500 text-[10px] font-sans transition-colors"
              title="Return to Student Portal"
            >
              <Home className="w-3 h-3" />
              <span>Test home</span>
            </button>

            {/* Questions list icon */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 text-slate-400 hover:text-white transition-colors"
              title="Question list"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col items-center gap-2 text-slate-500 hover:text-slate-300 cursor-pointer">
            <Settings className="w-4 h-4" />
          </div>
        </div>

        {/* 2B. QUESTION ROSTER SIDEBAR (Collapsible) */}
        {isSidebarOpen && (
          <aside className="w-64 bg-[#0e1117] border-r border-[#21262d] flex flex-col flex-shrink-0 select-none">
            <div className="px-4 py-3 border-b border-[#21262d]">
              <span className="text-xs font-semibold text-slate-400 tracking-wide">
                Programming
              </span>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              {test?.questions?.map((q, idx) => {
                const isActive = currentQIndex === idx;
                const isAnswered = (codeAnswers[idx] && codeAnswers[idx].trim().length > 15) || codeExecutionResults[idx];
                const cleanTitle = q.questionText ? q.questionText.split('\n')[0].replace(/^#+\s*/, '') : `Problem ${idx + 1}`;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentQIndex(idx)}
                    className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center gap-3 ${
                      isActive
                        ? 'bg-[#161b22] text-[#00ea64] font-medium border-l-2 border-[#00ea64]'
                        : 'text-slate-300 hover:text-white hover:bg-[#161b22]/50 border-l-2 border-transparent'
                    }`}
                  >
                    <span className={`font-mono text-xs ${isActive ? 'text-white font-bold' : 'text-slate-400'}`}>
                      {idx + 1}
                    </span>
                    <span className="truncate flex-1">
                      {cleanTitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* 2C. CENTER-LEFT: PROBLEM STATEMENT DESCRIPTION PANEL */}
        <section className="w-1/2 flex-1 border-r border-[#21262d] bg-[#0e1117] overflow-y-auto flex flex-col">
          {/* Problem Header Bar */}
          <div className="p-5 border-b border-[#21262d] space-y-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleMarkForReview}
                className={`p-1.5 rounded transition-colors ${
                  isMarked
                    ? 'text-amber-400'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={isMarked ? 'Unmark question' : 'Bookmark / Mark for review'}
              >
                <Bookmark className={`w-4 h-4 ${isMarked ? 'fill-amber-400' : ''}`} />
              </button>

              <h1 className="text-lg font-bold text-white tracking-tight">
                {currentQ.questionText ? currentQ.questionText.split('\n')[0].replace(/^#+\s*/, '') : `Problem ${currentQIndex + 1}`}
              </h1>
            </div>

            {currentQ.type === 'debugging' && (
              <div className="p-3 rounded bg-rose-950/40 border border-rose-900/80 flex items-center gap-2 text-xs text-rose-300">
                <Bug className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>Debugging Challenge: Inspect the defective code in the editor, locate the logic bugs, and correct them.</span>
              </div>
            )}
          </div>

          {/* Problem Statement Body */}
          <div className="p-6 space-y-6 text-[#c9d1d9] text-xs leading-relaxed overflow-y-auto flex-1 font-sans">
            {/* Main Prompt Text */}
            <div className="whitespace-pre-wrap space-y-2 text-slate-200">
              {currentQ.questionText || 'Implement the algorithm according to specifications.'}
            </div>

            {/* Reference Defective Code for Debugging Arena */}
            {currentQ.type === 'debugging' && currentQ.buggyCode && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-rose-400 font-mono">
                  Defective Implementation Reference:
                </div>
                <pre className="p-3 rounded bg-[#161b22] border border-rose-900/60 font-mono text-xs text-rose-300 overflow-x-auto">
                  {currentQ.buggyCode}
                </pre>
              </div>
            )}

            {/* Examples Section */}
            {publicTestCases.length > 0 && (
              <div className="space-y-4 pt-2">
                {publicTestCases.map((tc, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="text-xs font-bold text-white">
                      Example {idx + 1}
                    </div>
                    <div className="p-3 rounded bg-[#161b22] border border-[#30363d] space-y-1.5 font-mono text-xs text-slate-300">
                      <div>
                        <span className="text-slate-400">Input: </span>
                        <span className="text-white">{tc.input || '(empty)'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Output: </span>
                        <span className="text-[#00ea64] font-semibold">{tc.expectedOutput}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Constraints Section */}
            <div className="space-y-2 pt-2 border-t border-[#21262d]">
              <div className="text-xs font-bold text-white">
                Constraints
              </div>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-400 font-mono">
                <li>1 ≤ lengths of arrays ≤ 2 * 10⁵</li>
                <li>Time Limit: 5.0 seconds per test case</li>
                <li>Memory Limit: 256 MB</li>
                {currentQ.explanation && <li>Note: {currentQ.explanation}</li>}
              </ul>
            </div>
          </div>
        </section>

        {/* 2D. RIGHT PANEL: MONACO CODE EDITOR & DRAWER */}
        <section className="w-1/2 flex-1 bg-[#0e1117] flex flex-col overflow-hidden relative">
          {/* Editor Header Toolbar (Matching Reference Screenshot) */}
          <div className="h-10 bg-[#0e1117] border-b border-[#21262d] px-4 flex items-center justify-between text-xs flex-shrink-0">
            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs font-normal">Language</span>
              <select
                value={currentLangId}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="py-1 px-2.5 rounded bg-[#161b22] border border-[#30363d] text-white font-mono text-xs focus:outline-none focus:border-slate-500 cursor-pointer"
              >
                {LANGUAGE_CONFIGS.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.label}
                  </option>
                ))}
              </select>
              <Info className="w-3.5 h-3.5 text-slate-500 cursor-pointer hover:text-slate-300" title="Compiler info & standards" />
            </div>

            {/* Editor Action Icons: Reset Code & Fullscreen (Highlighted in user's image) */}
            <div className="flex items-center gap-2">
              {/* Highlighted Reset Button */}
              <button
                type="button"
                onClick={() => setResetConfirmOpen(true)}
                className="p-1 rounded border border-[#30363d] text-slate-300 hover:text-white hover:border-[#00ea64] hover:bg-[#161b22] transition-colors"
                title="Reset code to problem template"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1 rounded border border-[#30363d] text-slate-300 hover:text-white hover:bg-[#161b22] transition-colors"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen editor'}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Monaco Editor Canvas */}
          <div className="flex-1 w-full overflow-hidden relative bg-[#0e1117]">
            <Editor
              height="100%"
              language={currentLangConfig.monaco}
              value={currentCode}
              theme="arenaDark"
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
                lineDecorationsWidth: 8,
                lineNumbersMinChars: 3
              }}
              loading={
                <div className="h-full flex items-center justify-center p-8 bg-[#0e1117] text-slate-400 font-mono text-xs">
                  Loading Code Editor...
                </div>
              }
            />
          </div>

          {/* Editor Status Bar Footer (Matching Screenshot) */}
          <div className="h-6 bg-[#0e1117] border-t border-[#21262d] px-4 flex items-center justify-between text-[11px] text-slate-400 font-mono flex-shrink-0">
            <div className="flex items-center gap-4">
              <span>Ln {editorCursor.line}, Col {editorCursor.col}</span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ea64] inline-block" /> Autocomplete
              </span>
              <span>Spaces: 4</span>
              <span>Mode: Normal</span>
            </div>
            <div>
              <span className="uppercase text-slate-500 font-semibold">
                {currentLangConfig.label}
              </span>
            </div>
          </div>

          {/* ─── 2E. BOTTOM DRAWER: TEST RESULTS & RUN CODE ───────────── */}
          <div
            className={`bg-[#0e1117] border-t border-[#21262d] transition-all duration-200 flex flex-col flex-shrink-0 z-20 ${
              isDrawerOpen ? 'h-64' : 'h-12'
            }`}
          >
            {/* Drawer Control Header Bar */}
            <div className="h-12 px-4 flex items-center justify-between border-b border-[#21262d] bg-[#0e1117] flex-shrink-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  {isDrawerOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  <span>Test Results</span>
                </button>

                {/* Score summary badge if evaluated */}
                {activeResult && (
                  <span className={`text-[11px] px-2 py-0.5 rounded font-mono font-medium ${
                    activeResult.passed
                      ? 'bg-emerald-950 text-[#00ea64] border border-[#00ea64]/40'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}>
                    {activeResult.passedCount} / {activeResult.totalCount} Passed
                  </span>
                )}
              </div>

              {/* Action Buttons: Run Code & Submit Code (Run Code in green border/text) */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="border border-[#00ea64] text-[#00ea64] hover:bg-[#00ea64]/10 active:bg-[#00ea64]/20 rounded-md px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isRunning ? 'Running...' : 'Run Code'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmitCode}
                  disabled={isSubmittingCode}
                  className="bg-[#00ea64] hover:bg-[#00d257] active:bg-[#00be4e] text-black rounded-md px-4 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingCode ? 'Evaluating...' : 'Submit Code'}</span>
                </button>
              </div>
            </div>

            {/* Drawer Body (Visible when expanded) */}
            {isDrawerOpen && (
              <div className="flex-1 flex flex-col overflow-hidden p-3 space-y-2 bg-[#0e1117]">
                {/* Tabs */}
                <div className="flex items-center gap-2 text-xs border-b border-[#21262d] pb-1.5">
                  <button
                    type="button"
                    onClick={() => setDrawerTab('testcases')}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                      drawerTab === 'testcases'
                        ? 'bg-[#161b22] text-[#00ea64] border border-[#30363d]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Test Cases
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawerTab('custom')}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                      drawerTab === 'custom'
                        ? 'bg-[#161b22] text-[#00ea64] border border-[#30363d]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Custom Input
                  </button>
                  {activeResult && (
                    <button
                      type="button"
                      onClick={() => setDrawerTab('results')}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                        drawerTab === 'results'
                          ? 'bg-[#161b22] text-[#00ea64] border border-[#30363d]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Evaluation Breakdown
                    </button>
                  )}
                </div>

                {/* Error Banner */}
                {runError && (
                  <div className="p-2.5 rounded bg-rose-950/60 border border-rose-900 text-rose-300 text-xs flex items-center gap-2">
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
                            className={`p-2.5 rounded border text-xs font-mono space-y-1 ${
                              tr.passed
                                ? 'bg-[#161b22] border-[#00ea64]/40 text-slate-200'
                                : 'bg-[#161b22] border-rose-900/60 text-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold flex items-center gap-1.5">
                                {tr.passed ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00ea64]" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                )}
                                <span>Case {idx + 1} {tr.isHidden ? '(Hidden)' : ''}</span>
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                tr.passed ? 'text-[#00ea64] bg-[#00ea64]/10' : 'text-rose-400 bg-rose-950'
                              }`}>
                                {tr.passed ? 'Passed' : tr.status || 'Failed'}
                              </span>
                            </div>
                            {!tr.isHidden ? (
                              <div className="text-[11px] space-y-0.5 text-slate-300">
                                <div><span className="text-slate-400">Output:</span> {tr.actualOutput || '(none)'}</div>
                                <div><span className="text-slate-400">Expected:</span> {tr.expectedOutput}</div>
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400 italic">Hidden verification test case</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-slate-400 font-mono text-xs">
                        Click <strong>Run Code</strong> to test your solution against standard sample test cases.
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
                      placeholder="Enter standard input (stdin)..."
                      className="w-full p-2.5 rounded bg-[#161b22] border border-[#30363d] text-slate-200 text-xs focus:outline-none focus:border-slate-500 font-mono"
                    />

                    {customRunOutput && (
                      <div className="p-2.5 rounded bg-[#161b22] border border-[#30363d] text-slate-100 space-y-1">
                        <div className="text-[10px] text-slate-400 font-bold uppercase flex justify-between">
                          <span>Output ({customRunOutput.time}s, {customRunOutput.memory}KB)</span>
                          <span className="text-[#00ea64]">{customRunOutput.status?.description}</span>
                        </div>
                        {customRunOutput.stdout && <pre className="text-[#00ea64] text-xs">{customRunOutput.stdout}</pre>}
                        {customRunOutput.stderr && <pre className="text-rose-400 text-xs">{customRunOutput.stderr}</pre>}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 3: Detailed Breakdown */}
                {drawerTab === 'results' && activeResult && (
                  <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between p-3 rounded bg-[#161b22] border border-[#30363d]">
                      <div>
                        <div className="font-bold text-white text-sm">{activeResult.status}</div>
                        <div className="text-[11px] text-slate-400">Marks Awarded: {activeResult.score} / {activeResult.maxScore} marks</div>
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

      {/* ─── 3. RESET CONFIRMATION MODAL ────────────────────────── */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-4 text-xs font-sans shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-[#00ea64]" />
              Reset Code Template
            </h3>
            <p className="text-slate-300 leading-relaxed">
              Are you sure you want to revert your code to the original problem starter template? Any unsaved edits will be permanently lost.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="px-3 py-1.5 rounded text-slate-300 hover:text-white border border-[#30363d] hover:bg-[#21262d] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetCode}
                className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors"
              >
                Reset Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 4. HELP GUIDELINES MODAL ────────────────────────── */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-4 text-xs font-sans shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#00ea64]" />
              Coding Arena Guidelines
            </h3>
            <ul className="space-y-2 text-slate-300 leading-relaxed">
              <li>• <strong>Run Code</strong>: Compiles and tests your solution against standard sample test cases without official score impact.</li>
              <li>• <strong>Submit Code</strong>: Evaluates your code against all public and hidden test cases, records marks, and saves to Supabase.</li>
              <li>• <strong>Save & Proceed</strong>: Saves your progress and moves to the next question.</li>
              <li>• <strong>Reset Code</strong>: Restores the code editor to the initial question template or flawed reference code.</li>
              <li>• <strong>Languages Supported</strong>: C, C++, Java 17, Python 3, and JavaScript (Node.js).</li>
            </ul>
            <button
              type="button"
              className="w-full py-2 bg-[#00ea64] hover:bg-[#00d257] text-black font-bold rounded transition-colors"
              onClick={() => setIsHelpOpen(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodingArenaView;
