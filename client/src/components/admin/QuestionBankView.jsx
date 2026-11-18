import React, { useState, useEffect, useMemo } from 'react';
import Card, { CardBody, CardHeader } from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import Loader from '../common/Loader';
import adminService from '../../services/adminService';
import testService from '../../services/testService';
import {
  HelpCircle,
  Search,
  Filter,
  Plus,
  RotateCcw,
  BookOpen,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  FileText,
  Tag,
  Edit,
  Trash2,
  CheckSquare,
  Calculator,
  Brain,
  Hash,
  Cpu,
  Terminal,
  Code2,
  Bug,
  Database
} from 'lucide-react';

const QUESTION_TYPES = [
  { id: 'multiple_choice', label: 'Single Correct MCQ', icon: Cpu },
  { id: 'multiple_answers', label: 'Multiple Correct MCQs', icon: CheckSquare },
  { id: 'numerical', label: 'Numerical Answer', icon: Calculator },
  { id: 'logical_reasoning', label: 'Logical Reasoning', icon: Brain },
  { id: 'quantitative_aptitude', label: 'Quantitative Aptitude', icon: Hash },
  { id: 'verbal_ability', label: 'Verbal Ability', icon: BookOpen },
  { id: 'coding', label: 'Coding Challenge', icon: Code2 },
  { id: 'debugging', label: 'Debugging Arena', icon: Bug },
  { id: 'sql', label: 'SQL Arena', icon: Database },
  { id: 'output_prediction', label: 'Output Prediction', icon: Terminal },
];

const QuestionBankView = () => {
  const [questions, setQuestions] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Question form state
  const initialFormState = {
    testId: '',
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    correctAnswers: [0],
    correctNumber: '',
    tolerance: 0,
    marks: 1,
    questionType: 'multiple_choice',
    explanation: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [qRes, tRes] = await Promise.all([
        adminService.getQuestionBank(),
        testService.getTests()
      ]);
      setQuestions(qRes.questions || []);
      setTests(tRes.tests || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch question bank.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const qText = (q.questionText || '').toLowerCase();
      const tTitle = (q.testTitle || '').toLowerCase();
      const s = search.toLowerCase();
      const matchSearch = qText.includes(s) || tTitle.includes(s);
      const matchCategory = categoryFilter === 'ALL' || q.category === categoryFilter;
      const matchType = typeFilter === 'ALL' || (q.type || 'multiple_choice') === typeFilter;
      return matchSearch && matchCategory && matchType;
    });
  }, [questions, search, categoryFilter, typeFilter]);

  const categories = useMemo(() => {
    const set = new Set(questions.map((q) => q.category).filter(Boolean));
    return Array.from(set);
  }, [questions]);

  const handleOpenAdd = () => {
    setEditingQuestionId(null);
    setFormData({
      ...initialFormState,
      testId: tests[0]?.id || tests[0]?._id || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (q) => {
    setEditingQuestionId(q.id);
    setFormData({
      testId: q.testId || '',
      questionText: q.questionText || '',
      options: Array.isArray(q.options) && q.options.length > 0 ? q.options : ['', '', '', ''],
      correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : 0,
      correctAnswers: Array.isArray(q.correctAnswers) ? q.correctAnswers : [q.correctAnswer || 0],
      correctNumber: q.correctNumber !== undefined ? q.correctNumber : '',
      tolerance: q.tolerance || 0,
      marks: q.marks || 1,
      questionType: q.type || 'multiple_choice',
      explanation: q.explanation || ''
    });
    setIsModalOpen(true);
  };

  const handleOptionChange = (index, value) => {
    const updated = [...formData.options];
    updated[index] = value;
    setFormData({ ...formData, options: updated });
  };

  const addOption = () => {
    if (formData.options.length >= 8) return;
    setFormData({ ...formData, options: [...formData.options, ''] });
  };

  const removeOption = (index) => {
    if (formData.options.length <= 2) return;
    const updated = formData.options.filter((_, i) => i !== index);
    let newCorrect = formData.correctAnswer;
    if (newCorrect === index) newCorrect = 0;
    else if (newCorrect > index) newCorrect -= 1;
    setFormData({ ...formData, options: updated, correctAnswer: newCorrect });
  };

  const toggleMultiAnswer = (optIndex) => {
    const current = [...(formData.correctAnswers || [0])];
    const pos = current.indexOf(optIndex);
    if (pos > -1) {
      if (current.length > 1) current.splice(pos, 1);
    } else {
      current.push(optIndex);
    }
    setFormData({ ...formData, correctAnswers: current.sort((a, b) => a - b) });
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!formData.questionText.trim()) {
      alert('Question text is required.');
      return;
    }

    try {
      setActionLoading(true);
      if (editingQuestionId) {
        await adminService.updateQuestionInBank(editingQuestionId, formData);
        showNotification('Question updated successfully!');
      } else {
        await adminService.addQuestionToBank(formData);
        showNotification('Question successfully added to question bank!');
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      alert(err.message || 'Operation failed. Please verify inputs.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteQuestion = async (id, text) => {
    if (!window.confirm(`Delete question: "${text.substring(0, 40)}..."?`)) return;

    try {
      await adminService.deleteQuestionFromBank(id);
      showNotification('Question removed from assessment and question bank.');
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to delete question');
    }
  };

  const getTypeLabel = (type) => {
    const found = QUESTION_TYPES.find((t) => t.id === type);
    return found ? found.label : (type || 'Multiple Choice');
  };

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Search and Action Bar */}
      <Card className="border-slate-200 dark:border-navy-800">
        <CardBody className="p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-1 w-full flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by keyword or assessment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-electric-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full sm:w-auto py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-950 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full sm:w-auto py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-950 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Archetypes</option>
                {QUESTION_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchData} className="text-xs">
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={handleOpenAdd} className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Question
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Questions List */}
      <Card className="border-slate-200 dark:border-navy-800">
        <CardHeader className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 dark:border-navy-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-electric-500" />
              Institutional Question Repository ({filteredQuestions.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Curated items from active tests and normalized Supabase question archives
            </p>
          </div>
        </CardHeader>

        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader message="Loading question bank..." />
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No questions found matching your search criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-navy-800">
            {filteredQuestions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="p-4 sm:p-5 hover:bg-slate-50/50 dark:hover:bg-navy-850/40 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="primary" size="sm">{getTypeLabel(q.type)}</Badge>
                      <Badge variant="outline" size="sm">{q.category || 'General'}</Badge>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {q.testTitle ? `Assigned to: ${q.testTitle}` : 'Standalone Question'}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        {q.marks || 1} Mark(s)
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-slate-900 dark:text-white pt-1">
                      {q.questionText}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleOpenEdit(q)}
                      className="text-xs text-electric-600"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(q.id, q.questionText)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Delete question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Question options or value display */}
                {Array.isArray(q.options) && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                    {q.options.map((opt, optIdx) => {
                      const isSingleCorrect = Number(q.correctAnswer) === optIdx;
                      const isMultiCorrect = Array.isArray(q.correctAnswers) && q.correctAnswers.includes(optIdx);
                      const isCorrect = isSingleCorrect || isMultiCorrect;

                      return (
                        <div
                          key={optIdx}
                          className={`p-2 rounded-lg border flex items-center justify-between ${isCorrect
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-semibold'
                              : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-750 text-slate-700 dark:text-slate-300'
                            }`}
                        >
                          <span className="truncate">{opt}</span>
                          {isCorrect && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 ml-1" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.type === 'numerical' && q.correctNumber !== undefined && (
                  <div className="p-2.5 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs font-mono text-emerald-800 dark:text-emerald-300">
                    Expected Value: <strong>{q.correctNumber}</strong> (Tolerance: ±{q.tolerance || 0})
                  </div>
                )}

                {q.explanation && (
                  <div className="text-[11px] text-slate-500 italic bg-slate-50 dark:bg-navy-950 p-2 rounded-md border border-slate-100 dark:border-navy-800">
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add / Edit Question Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingQuestionId ? 'Edit Question Item' : 'Add Question to Repository'}
        size="lg"
      >
        <form onSubmit={handleSaveQuestion} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Attach to Assessment (Optional)
              </label>
              <select
                value={formData.testId}
                onChange={(e) => setFormData({ ...formData, testId: e.target.value })}
                className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-950 text-slate-800 dark:text-slate-200"
              >
                <option value="">Standalone Repository Item</option>
                {tests.map((t) => (
                  <option key={t.id || t._id} value={t.id || t._id}>
                    {t.title} ({t.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Question Archetype *
              </label>
              <select
                value={formData.questionType}
                onChange={(e) => setFormData({ ...formData, questionType: e.target.value })}
                className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-950 text-slate-800 dark:text-slate-200"
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Question Statement / Prompt *
            </label>
            <textarea
              rows={3}
              required
              value={formData.questionText}
              onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
              placeholder="Enter question text or prompt..."
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Options for MCQ / Multiple Answers / Logical / Quant / Verbal */}
          {['multiple_choice', 'multiple_answers', 'logical_reasoning', 'quantitative_aptitude', 'verbal_ability'].includes(formData.questionType) && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Answer Choices {formData.questionType === 'multiple_answers' ? '(Check all correct answers)' : '(Radio button = Correct answer)'}
              </label>
              <div className="space-y-2">
                {formData.options.map((opt, optIdx) => (
                  <div key={optIdx} className="flex items-center gap-2">
                    {formData.questionType === 'multiple_answers' ? (
                      <input
                        type="checkbox"
                        checked={(formData.correctAnswers || []).includes(optIdx)}
                        onChange={() => toggleMultiAnswer(optIdx)}
                        className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                        title="Mark as correct choice"
                      />
                    ) : (
                      <input
                        type="radio"
                        name="correct-q"
                        checked={Number(formData.correctAnswer) === optIdx}
                        onChange={() => setFormData({ ...formData, correctAnswer: optIdx })}
                        className="w-4 h-4 text-electric-600 cursor-pointer"
                        title="Mark as correct answer"
                      />
                    )}
                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={(e) => handleOptionChange(optIdx, e.target.value)}
                      placeholder={`Option ${optIdx + 1}`}
                      className="flex-1 py-1.5 px-3 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(optIdx)}
                      disabled={formData.options.length <= 2}
                      className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              {formData.options.length < 8 && (
                <Button variant="ghost" size="xs" onClick={addOption} className="text-xs text-electric-600">
                  <Plus className="w-3 h-3 mr-1" /> Add Option
                </Button>
              )}
            </div>
          )}

          {/* Numerical answer input */}
          {formData.questionType === 'numerical' && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-navy-950 rounded-xl border border-slate-200 dark:border-navy-800">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Correct Numerical Value *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formData.correctNumber}
                  onChange={(e) => setFormData({ ...formData, correctNumber: e.target.value })}
                  placeholder="e.g. 68.57"
                  className="w-full py-1.5 px-3 text-xs font-mono rounded-lg border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-900 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tolerance (±)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formData.tolerance}
                  onChange={(e) => setFormData({ ...formData, tolerance: parseFloat(e.target.value) || 0 })}
                  placeholder="0.05"
                  className="w-full py-1.5 px-3 text-xs font-mono rounded-lg border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-900 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Marks / Weight
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.marks}
                onChange={(e) => setFormData({ ...formData, marks: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full py-1.5 px-3 text-xs font-mono rounded-lg border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Explanation & Rationale (Displayed after result release)
            </label>
            <input
              type="text"
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              placeholder="e.g. Concept formula, reasoning steps, or hint..."
              className="w-full py-1.5 px-3 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-navy-800">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={actionLoading}>
              {editingQuestionId ? 'Update Question' : 'Save Question'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default QuestionBankView;
