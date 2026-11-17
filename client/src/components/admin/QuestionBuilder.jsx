import React, { useState } from 'react';
import Card, { CardBody } from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import {
  Code2,
  Bug,
  Cpu,
  Brain,
  Database,
  Terminal,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Table,
  Eye
} from 'lucide-react';

export const QUESTION_TYPES = [
  { id: 'multiple_choice', label: 'Technical MCQ', icon: Cpu, badge: 'MCQ', desc: 'Single-choice question with 2-6 options' },
  { id: 'coding', label: 'Coding Challenge', icon: Code2, badge: 'Code', desc: 'Algorithm/implementation with test cases' },
  { id: 'debugging', label: 'Debugging Arena', icon: Bug, badge: 'Debug', desc: 'Find and fix bugs in flawed code' },
  { id: 'aptitude', label: 'Aptitude & Logic', icon: Brain, badge: 'Logic', desc: 'Quantitative, deductive, or verbal reasoning' },
  { id: 'sql', label: 'SQL Query Arena', icon: Database, badge: 'SQL', desc: 'Relational query design against schema' },
  { id: 'output_prediction', label: 'Output Prediction', icon: Terminal, badge: 'Output', desc: 'Predict execution output of snippet' },
];

export const createDefaultQuestion = (type = 'multiple_choice') => {
  switch (type) {
    case 'coding':
      return {
        type: 'coding',
        questionText: '',
        marks: 10,
        language: 'javascript',
        starterCode: 'function solution(nums) {\n  // Write your code here\n  return nums;\n}',
        correctSolution: '',
        testCases: [
          { input: '[2, 7, 11, 15], 9', expectedOutput: '[0, 1]', isHidden: false },
          { input: '[3, 2, 4], 6', expectedOutput: '[1, 2]', isHidden: true }
        ],
        explanation: ''
      };

    case 'debugging':
      return {
        type: 'debugging',
        questionText: 'Identify the bug and fix the function below.',
        marks: 5,
        language: 'javascript',
        buggyCode: 'function calculateDiscount(price, discount) {\n  // BUG: Discount is applied inversely\n  return price + (price * discount);\n}',
        correctSolution: 'function calculateDiscount(price, discount) {\n  return price - (price * discount);\n}',
        explanation: 'The plus sign should be a minus sign to subtract discount.'
      };

    case 'sql':
      return {
        type: 'sql',
        questionText: 'Write a SQL query to retrieve employee names and department names with salary > 50000.',
        marks: 5,
        schemaSql: 'CREATE TABLE employees (id INT, name VARCHAR(50), salary INT, dept_id INT);\nCREATE TABLE departments (id INT, name VARCHAR(50));',
        expectedQuery: 'SELECT e.name, d.name AS dept FROM employees e JOIN departments d ON e.dept_id = d.id WHERE e.salary > 50000;',
        explanation: 'Uses INNER JOIN on dept_id and filters salary with WHERE clause.'
      };

    case 'output_prediction':
      return {
        type: 'output_prediction',
        questionText: 'What is the console output of the following code?',
        marks: 2,
        language: 'javascript',
        codeSnippet: 'console.log(typeof NaN);\nconsole.log(0.1 + 0.2 === 0.3);',
        options: [
          '"number" and false',
          '"NaN" and true',
          '"undefined" and false',
          '"number" and true'
        ],
        correctAnswer: 0,
        explanation: 'NaN is typeof number in JS. Floating-point math 0.1+0.2 is 0.30000000000000004, so equality is false.'
      };

    case 'aptitude':
      return {
        type: 'aptitude',
        questionText: 'A train running at 60 km/hr crosses a pole in 9 seconds. What is the length of the train?',
        marks: 2,
        options: ['120 meters', '150 meters', '180 meters', '324 meters'],
        correctAnswer: 1,
        explanation: 'Speed = 60 * (5/18) = 50/3 m/s. Length = Speed * Time = (50/3) * 9 = 150 meters.'
      };

    case 'multiple_choice':
    default:
      return {
        type: 'multiple_choice',
        questionText: '',
        marks: 1,
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: ''
      };
  }
};

const QuestionBuilderItem = ({
  question,
  index,
  totalCount,
  onChange,
  onDelete,
  onDuplicate
}) => {
  const currentTypeMeta = QUESTION_TYPES.find((t) => t.id === (question.type || 'multiple_choice')) || QUESTION_TYPES[0];
  const Icon = currentTypeMeta.icon;

  const handleTypeChange = (newType) => {
    const updated = createDefaultQuestion(newType);
    updated.questionText = question.questionText || updated.questionText;
    updated.marks = question.marks || updated.marks;
    onChange(updated);
  };

  const updateField = (field, val) => {
    onChange({ ...question, [field]: val });
  };

  // Option handlers for MCQ / Aptitude / Output Prediction
  const handleOptionChange = (optIdx, val) => {
    const newOptions = [...(question.options || [])];
    newOptions[optIdx] = val;
    onChange({ ...question, options: newOptions });
  };

  const addOption = () => {
    if ((question.options || []).length >= 6) return;
    onChange({ ...question, options: [...(question.options || []), ''] });
  };

  const removeOption = (optIdx) => {
    if ((question.options || []).length <= 2) return;
    const newOptions = question.options.filter((_, idx) => idx !== optIdx);
    let newCorrect = question.correctAnswer;
    if (newCorrect === optIdx) newCorrect = 0;
    else if (newCorrect > optIdx) newCorrect -= 1;
    onChange({ ...question, options: newOptions, correctAnswer: newCorrect });
  };

  // Test case handlers for Coding Challenge
  const handleTestCaseChange = (tcIdx, field, val) => {
    const newTCs = [...(question.testCases || [])];
    newTCs[tcIdx] = { ...newTCs[tcIdx], [field]: val };
    onChange({ ...question, testCases: newTCs });
  };

  const addTestCase = () => {
    const newTCs = [...(question.testCases || []), { input: '', expectedOutput: '', isHidden: false }];
    onChange({ ...question, testCases: newTCs });
  };

  const removeTestCase = (tcIdx) => {
    const newTCs = (question.testCases || []).filter((_, idx) => idx !== tcIdx);
    onChange({ ...question, testCases: newTCs });
  };

  return (
    <Card className="border-slate-200 dark:border-navy-800 shadow-xs hover:border-slate-300 dark:hover:border-navy-700 transition-colors">
      <CardBody className="p-4 sm:p-5 space-y-4">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-navy-800">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-bold font-mono">
              {index + 1}
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-electric-50 dark:bg-electric-950/60 border border-electric-200 dark:border-electric-900 text-electric-700 dark:text-electric-300 text-xs font-semibold">
              <Icon className="w-3.5 h-3.5" />
              <span>{currentTypeMeta.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Question Type Switcher */}
            <select
              value={question.type || 'multiple_choice'}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="py-1 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-850 text-slate-800 dark:text-slate-200 font-medium"
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>

            {/* Marks input */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Marks:</span>
              <input
                type="number"
                min="1"
                max="100"
                value={question.marks || 1}
                onChange={(e) => updateField('marks', Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 py-1 px-2 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-850 text-slate-900 dark:text-slate-100 text-center"
              />
            </div>

            {/* Duplicate Button */}
            <button
              type="button"
              onClick={onDuplicate}
              title="Duplicate question"
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
            >
              <FileCode className="w-4 h-4" />
            </button>

            {/* Delete button */}
            <button
              type="button"
              onClick={onDelete}
              disabled={totalCount <= 1}
              title={totalCount <= 1 ? 'Minimum 1 question required' : 'Delete question'}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Question Text */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Question Prompt / Statement <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            required
            value={question.questionText || ''}
            onChange={(e) => updateField('questionText', e.target.value)}
            placeholder="Type your question prompt here..."
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-electric-500"
          />
        </div>

        {/* ── Type Specific Editors ────────────────────────────────────────── */}

        {/* 1. Multiple Choice / Aptitude / Technical */}
        {['multiple_choice', 'aptitude', 'technical'].includes(question.type || 'multiple_choice') && (
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Answer Choices (Select radio button for Correct Answer)
            </label>
            <div className="space-y-2">
              {(question.options || []).map((opt, optIdx) => (
                <div key={optIdx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${index}`}
                    checked={question.correctAnswer === optIdx}
                    onChange={() => updateField('correctAnswer', optIdx)}
                    className="w-4 h-4 text-electric-600 focus:ring-electric-500 cursor-pointer"
                    title="Mark as correct answer"
                  />
                  <input
                    type="text"
                    required
                    value={opt}
                    onChange={(e) => handleOptionChange(optIdx, e.target.value)}
                    placeholder={`Option ${optIdx + 1}`}
                    className={`flex-1 py-1.5 px-3 text-xs rounded-lg border bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100 ${
                      question.correctAnswer === optIdx
                        ? 'border-emerald-500 ring-1 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-navy-750'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(optIdx)}
                    disabled={(question.options || []).length <= 2}
                    className="p-1 text-slate-400 hover:text-rose-500 disabled:opacity-30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {(question.options || []).length < 6 && (
              <Button variant="ghost" size="xs" onClick={addOption} className="text-xs text-electric-600">
                <Plus className="w-3 h-3 mr-1" /> Add Option
              </Button>
            )}
          </div>
        )}

        {/* 2. Output Prediction */}
        {question.type === 'output_prediction' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Code Snippet to Evaluate
              </label>
              <textarea
                rows={3}
                value={question.codeSnippet || ''}
                onChange={(e) => updateField('codeSnippet', e.target.value)}
                placeholder="console.log(typeof NaN);"
                className="w-full font-mono text-xs p-3 rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-900 text-emerald-400 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Predicted Output Choices (Radio = Correct Answer)
              </label>
              {(question.options || []).map((opt, optIdx) => (
                <div key={optIdx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-out-${index}`}
                    checked={question.correctAnswer === optIdx}
                    onChange={() => updateField('correctAnswer', optIdx)}
                    className="w-4 h-4 text-electric-600 focus:ring-electric-500 cursor-pointer"
                  />
                  <input
                    type="text"
                    required
                    value={opt}
                    onChange={(e) => handleOptionChange(optIdx, e.target.value)}
                    placeholder={`Expected Output Option ${optIdx + 1}`}
                    className="flex-1 py-1.5 px-3 font-mono text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(optIdx)}
                    disabled={(question.options || []).length <= 2}
                    className="p-1 text-slate-400 hover:text-rose-500 disabled:opacity-30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {(question.options || []).length < 6 && (
                <Button variant="ghost" size="xs" onClick={addOption} className="text-xs text-electric-600">
                  <Plus className="w-3 h-3 mr-1" /> Add Choice
                </Button>
              )}
            </div>
          </div>
        )}

        {/* 3. Coding Arena */}
        {question.type === 'coding' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Programming Language
                </label>
                <select
                  value={question.language || 'javascript'}
                  onChange={(e) => updateField('language', e.target.value)}
                  className="w-full py-1.5 px-3 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-950 text-slate-800 dark:text-slate-200"
                >
                  <option value="javascript">JavaScript (Node.js)</option>
                  <option value="python">Python 3</option>
                  <option value="java">Java 17</option>
                  <option value="cpp">C++ 20</option>
                  <option value="sql">PostgreSQL</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Starter / Boilerplate Code (Shown to student in editor)
              </label>
              <textarea
                rows={4}
                required
                value={question.starterCode || ''}
                onChange={(e) => updateField('starterCode', e.target.value)}
                placeholder="function solution(nums) { ... }"
                className="w-full font-mono text-xs p-3 rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-900 text-blue-300 focus:outline-none"
              />
            </div>

            {/* Test Cases */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Verification Test Cases
                </label>
                <Button variant="ghost" size="xs" onClick={addTestCase} className="text-xs text-electric-600">
                  <Plus className="w-3 h-3 mr-1" /> Add Test Case
                </Button>
              </div>

              {(question.testCases || []).map((tc, tcIdx) => (
                <div
                  key={tcIdx}
                  className="p-3 bg-slate-50 dark:bg-navy-950 rounded-xl border border-slate-200/80 dark:border-navy-800 space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span>Test Case #{tcIdx + 1}</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!tc.isHidden}
                          onChange={(e) => handleTestCaseChange(tcIdx, 'isHidden', e.target.checked)}
                          className="w-3.5 h-3.5 text-electric-600 rounded"
                        />
                        <span>Hidden Test Case</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => removeTestCase(tcIdx)}
                        disabled={(question.testCases || []).length <= 1}
                        className="text-slate-400 hover:text-rose-500 disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Standard Input:</span>
                      <input
                        type="text"
                        value={tc.input || ''}
                        onChange={(e) => handleTestCaseChange(tcIdx, 'input', e.target.value)}
                        placeholder="[2, 7, 11, 15], 9"
                        className="w-full py-1 px-2.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Expected Output:</span>
                      <input
                        type="text"
                        value={tc.expectedOutput || ''}
                        onChange={(e) => handleTestCaseChange(tcIdx, 'expectedOutput', e.target.value)}
                        placeholder="[0, 1]"
                        className="w-full py-1 px-2.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Debugging Arena */}
        {question.type === 'debugging' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Flawed / Buggy Code (To be fixed by student)
              </label>
              <textarea
                rows={4}
                required
                value={question.buggyCode || ''}
                onChange={(e) => updateField('buggyCode', e.target.value)}
                placeholder="function faultyCode() { ... }"
                className="w-full font-mono text-xs p-3 rounded-lg border border-rose-300 dark:border-rose-900 bg-slate-900 text-rose-300 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Reference Clean Solution (Expected correction)
              </label>
              <textarea
                rows={3}
                value={question.correctSolution || ''}
                onChange={(e) => updateField('correctSolution', e.target.value)}
                placeholder="function correctedCode() { ... }"
                className="w-full font-mono text-xs p-3 rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-900 text-emerald-400 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* 5. SQL Arena */}
        {question.type === 'sql' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Database Schema DDL / Mock Tables
              </label>
              <textarea
                rows={3}
                required
                value={question.schemaSql || ''}
                onChange={(e) => updateField('schemaSql', e.target.value)}
                placeholder="CREATE TABLE employees (id INT, name VARCHAR(50), salary INT);"
                className="w-full font-mono text-xs p-3 rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-900 text-sky-300 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Target Evaluation SQL Query
              </label>
              <textarea
                rows={2}
                value={question.expectedQuery || ''}
                onChange={(e) => updateField('expectedQuery', e.target.value)}
                placeholder="SELECT name, salary FROM employees WHERE salary > 50000;"
                className="w-full font-mono text-xs p-3 rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-900 text-amber-300 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Explanation & Rationale */}
        <div className="pt-2 border-t border-slate-100 dark:border-navy-800">
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Explanation / Evaluation Notes (Shown during post-test review)
          </label>
          <input
            type="text"
            value={question.explanation || ''}
            onChange={(e) => updateField('explanation', e.target.value)}
            placeholder="e.g. Concept explanation, time complexity hints, or reasoning..."
            className="w-full py-1.5 px-3 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-950 text-slate-700 dark:text-slate-300"
          />
        </div>
      </CardBody>
    </Card>
  );
};

export const QuestionBuilder = ({ questions = [], onChange }) => {
  const handleAddQuestion = (type = 'multiple_choice') => {
    onChange([...questions, createDefaultQuestion(type)]);
  };

  const handleUpdate = (idx, updatedQ) => {
    const next = [...questions];
    next[idx] = updatedQ;
    onChange(next);
  };

  const handleDelete = (idx) => {
    if (questions.length <= 1) return;
    onChange(questions.filter((_, i) => i !== idx));
  };

  const handleDuplicate = (idx) => {
    const clone = JSON.parse(JSON.stringify(questions[idx]));
    clone.questionText = `${clone.questionText} (Copy)`;
    const next = [...questions];
    next.splice(idx + 1, 0, clone);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Assessment Questions ({questions.length})</span>
            <Badge variant="primary">
              Total Weight: {questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0)} Marks
            </Badge>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Design multi-disciplinary items: MCQ, Coding, Debugging, Aptitude, SQL, Output Prediction
          </p>
        </div>

        {/* Quick Add Dropdown */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => handleAddQuestion('multiple_choice')}
            className="text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Question
          </Button>
        </div>
      </div>

      {/* Questions Stack */}
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <QuestionBuilderItem
            key={idx}
            question={q}
            index={idx}
            totalCount={questions.length}
            onChange={(updated) => handleUpdate(idx, updated)}
            onDelete={() => handleDelete(idx)}
            onDuplicate={() => handleDuplicate(idx)}
          />
        ))}
      </div>

      {/* Bottom Type Palette */}
      <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-navy-750 bg-slate-50/50 dark:bg-navy-900/40 text-center space-y-2">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Add specific question archetype:
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {QUESTION_TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleAddQuestion(t.id)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-850 hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Icon className="w-3.5 h-3.5 text-electric-600 dark:text-electric-400" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuestionBuilder;
