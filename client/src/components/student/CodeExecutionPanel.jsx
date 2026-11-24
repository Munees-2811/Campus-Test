import React, { useState } from 'react';
import Card, { CardBody } from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Loader from '../common/Loader';
import testService from '../../services/testService';
import {
  Play,
  Send,
  Terminal,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const CodeExecutionPanel = ({
  testId,
  questionIndex,
  sourceCode,
  language = 'javascript',
  testCases = [],
  onSubmissionResult
}) => {
  const [activeTab, setActiveTab] = useState('testcases'); // 'testcases' | 'custom' | 'results'
  const [customInput, setCustomInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Results state
  const [customRunOutput, setCustomRunOutput] = useState(null);
  const [suiteResult, setSuiteResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Run Code with Custom Input
  const handleRunCustomCode = async () => {
    if (!sourceCode || !sourceCode.trim()) {
      setErrorMsg('Please write some code before running.');
      return;
    }

    try {
      setIsRunning(true);
      setErrorMsg('');
      const res = await testService.runCode({
        sourceCode,
        language,
        stdin: customInput
      });

      if (res.success && res.output) {
        setCustomRunOutput(res.output);
        setActiveTab('custom');
      } else {
        setErrorMsg('Execution failed to produce output.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Execution request failed.');
    } finally {
      setIsRunning(false);
    }
  };

  // 2. Submit Code against Public and Hidden Test Cases
  const handleSubmitCode = async () => {
    if (!sourceCode || !sourceCode.trim()) {
      setErrorMsg('Cannot submit empty code.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const res = await testService.submitCode({
        testId,
        questionIndex,
        sourceCode,
        language
      });

      if (res.success && res.result) {
        setSuiteResult(res.result);
        setActiveTab('results');
        if (onSubmissionResult) {
          onSubmissionResult(res.result);
        }
      } else {
        setErrorMsg('Evaluation submission failed.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit code for evaluation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const publicTestCases = testCases.filter((tc) => !tc.isHidden);

  return (
    <div className="space-y-3 pt-2">
      {/* Top Action & Tab Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-100/80 dark:bg-navy-950/80 rounded-xl border border-slate-200 dark:border-navy-800">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('testcases')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'testcases'
                ? 'bg-white dark:bg-navy-800 text-electric-600 dark:text-electric-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Sample Test Cases</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-navy-700">
              {publicTestCases.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'custom'
                ? 'bg-white dark:bg-navy-800 text-electric-600 dark:text-electric-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Custom Input</span>
          </button>

          {suiteResult && (
            <button
              type="button"
              onClick={() => setActiveTab('results')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'results'
                  ? 'bg-white dark:bg-navy-800 text-electric-600 dark:text-electric-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Test Results</span>
              <Badge
                variant={suiteResult.passed ? 'success' : 'danger'}
                size="sm"
              >
                {suiteResult.passedCount} / {suiteResult.totalCount}
              </Badge>
            </button>
          )}
        </div>

        {/* Execution Buttons */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleRunCustomCode}
            isLoading={isRunning}
            icon={Play}
            className="text-xs"
          >
            Run Code
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSubmitCode}
            isLoading={isSubmitting}
            icon={Send}
            className="text-xs"
          >
            Submit Code
          </Button>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ─── TAB 1: SAMPLE TEST CASES ─── */}
      {activeTab === 'testcases' && (
        <div className="space-y-2">
          {publicTestCases.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {publicTestCases.map((tc, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 dark:bg-navy-950 rounded-xl border border-slate-200 dark:border-navy-800 font-mono text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                    <span>Test Case #{idx + 1}</span>
                    <span className="text-emerald-600 dark:text-emerald-400">Public</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Input:</span>
                    <pre className="p-1.5 rounded bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200 overflow-x-auto text-[11px]">
                      {tc.input || '(empty input)'}
                    </pre>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Expected Output:</span>
                    <pre className="p-1.5 rounded bg-white dark:bg-navy-900 text-emerald-600 dark:text-emerald-400 font-bold overflow-x-auto text-[11px]">
                      {tc.expectedOutput}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-4 bg-slate-50 dark:bg-navy-950 rounded-xl text-xs text-slate-400 text-center font-mono">
              No public sample test cases configured for this problem. You can provide your own inputs in the Custom Input tab.
            </p>
          )}
        </div>
      )}

      {/* ─── TAB 2: CUSTOM INPUT & RUN CONSOLE ─── */}
      {activeTab === 'custom' && (
        <div className="space-y-3 p-4 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 font-mono text-xs">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-electric-400" /> Standard Input (stdin):
              </span>
              <span>Lines separated by enter</span>
            </div>
            <textarea
              rows={3}
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Provide custom input arguments..."
              className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-electric-500 font-mono text-xs"
            />
          </div>

          {customRunOutput && (
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Execution Output
                </span>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  {customRunOutput.time && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> {customRunOutput.time}s
                    </span>
                  )}
                  {customRunOutput.memory > 0 && (
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-slate-400" /> {customRunOutput.memory} KB
                    </span>
                  )}
                  <span
                    className={`px-1.5 py-0.5 rounded font-bold ${
                      customRunOutput.status?.id === 3
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {customRunOutput.status?.description || 'Executed'}
                  </span>
                </div>
              </div>

              {customRunOutput.compile_output && (
                <div className="p-2.5 rounded bg-amber-950/60 border border-amber-900 text-amber-300 text-[11px] overflow-x-auto">
                  <div className="font-bold text-amber-400 pb-1">Compilation Warning / Error:</div>
                  <pre>{customRunOutput.compile_output}</pre>
                </div>
              )}

              {customRunOutput.stderr && (
                <div className="p-2.5 rounded bg-rose-950/60 border border-rose-900 text-rose-300 text-[11px] overflow-x-auto">
                  <div className="font-bold text-rose-400 pb-1">Standard Error (stderr):</div>
                  <pre>{customRunOutput.stderr}</pre>
                </div>
              )}

              {customRunOutput.stdout && (
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-emerald-400 text-[11px] overflow-x-auto">
                  <pre>{customRunOutput.stdout}</pre>
                </div>
              )}

              {!customRunOutput.stdout && !customRunOutput.stderr && !customRunOutput.compile_output && (
                <div className="p-2 text-slate-500 italic text-[11px]">
                  Process exited successfully with no stdout output.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: TEST CASE EVALUATION SUITE RESULTS ─── */}
      {activeTab === 'results' && suiteResult && (
        <div className="space-y-3 p-4 bg-slate-50 dark:bg-navy-950 rounded-xl border border-slate-200 dark:border-navy-800">
          {/* Header Summary */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-navy-800">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  suiteResult.passed
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600'
                    : 'bg-rose-100 dark:bg-rose-950/80 text-rose-600'
                }`}
              >
                {suiteResult.passed ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {suiteResult.status || (suiteResult.passed ? 'Accepted' : 'Wrong Answer')}
                </h4>
                <div className="text-[11px] text-slate-500">
                  {suiteResult.passedCount} of {suiteResult.totalCount} test cases passed
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Marks Awarded</span>
                <span className="font-bold text-electric-600 dark:text-electric-400 text-sm">
                  {suiteResult.score} / {suiteResult.maxScore}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-navy-700" />
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Execution Time</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {suiteResult.executionTime || '0.000'}s
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-navy-700" />
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Peak Memory</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {suiteResult.memoryUsed || 0} KB
                </span>
              </div>
            </div>
          </div>

          {/* Individual Test Cases Result Grid */}
          <div className="space-y-2">
            {(suiteResult.testResults || []).map((tr, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border text-xs font-mono space-y-1.5 ${
                  tr.passed
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                    : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {tr.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    )}
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Test Case #{idx + 1}
                    </span>
                    {tr.isHidden && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-navy-800 text-slate-600 dark:text-slate-400 flex items-center gap-1 font-sans">
                        <EyeOff className="w-3 h-3" /> Hidden
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    {tr.time && <span>{tr.time}s</span>}
                    {tr.memory > 0 && <span>{tr.memory} KB</span>}
                    <Badge variant={tr.passed ? 'success' : 'danger'} size="sm">
                      {tr.passed ? 'PASSED' : tr.status || 'FAILED'}
                    </Badge>
                  </div>
                </div>

                {/* Show Details only for Public Test Cases */}
                {!tr.isHidden ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Standard Input:</span>
                      <pre className="p-1 rounded bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-300 overflow-x-auto">
                        {tr.input || '(empty input)'}
                      </pre>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Expected Output:</span>
                      <pre className="p-1 rounded bg-white dark:bg-navy-900 text-emerald-600 dark:text-emerald-400 font-bold overflow-x-auto">
                        {tr.expectedOutput}
                      </pre>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 text-[10px] block">Your Output:</span>
                      <pre
                        className={`p-1.5 rounded font-bold overflow-x-auto ${
                          tr.passed
                            ? 'bg-white dark:bg-navy-900 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-100/60 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {tr.actualOutput || '(no output)'}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="p-2 bg-white/60 dark:bg-navy-900/60 rounded text-[11px] text-slate-500 dark:text-slate-400 italic">
                    Hidden assessment evaluation case — inputs and exact outputs are confidential.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeExecutionPanel;
