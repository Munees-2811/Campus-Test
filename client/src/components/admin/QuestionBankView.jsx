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
  Tag
} from 'lucide-react';

const QuestionBankView = () => {
  const [questions, setQuestions] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // New question form
  const [newQ, setNewQ] = useState({
    testId: '',
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    marks: 1,
    questionType: 'multiple_choice'
  });

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
      const matchSearch =
        q.questionText.toLowerCase().includes(search.toLowerCase()) ||
        q.testTitle?.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        categoryFilter === 'ALL' || q.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [questions, search, categoryFilter]);

  const categories = useMemo(() => {
    const set = new Set(questions.map((q) => q.category).filter(Boolean));
    return Array.from(set);
  }, [questions]);

  const handleOptionChange = (index, value) => {
    const updated = [...newQ.options];
    updated[index] = value;
    setNewQ({ ...newQ, options: updated });
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newQ.questionText.trim()) {
      setError('Question text is required.');
      return;
    }
    if (newQ.options.some((opt) => !opt.trim())) {
      setError('Please fill in all options.');
      return;
    }

    try {
      setActionLoading(true);
      await adminService.addQuestionToBank(newQ);
      setIsAddModalOpen(false);
      setNewQ({
        testId: '',
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        marks: 1,
        questionType: 'multiple_choice'
      });
      showNotification('Question successfully added to question bank!');
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to add question.');
    } finally {
      setActionLoading(false);
    }
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
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search questions by text or test..."
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
                className="w-full sm:w-auto py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-electric-500"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Question</span>
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Questions List */}
      <Card className="border-slate-200 dark:border-navy-800 shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 dark:border-navy-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-electric-500" />
              Centralized Question Bank ({filteredQuestions.length})
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Review multiple-choice and evaluation items indexed across tests
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchData} className="text-xs">
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        </CardHeader>

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader message="Loading question bank..." />
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
            No questions found matching your filter criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-navy-800">
            {filteredQuestions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="p-4 sm:p-5 hover:bg-slate-50/70 dark:hover:bg-navy-850/40 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">
                        Q{idx + 1}.
                      </span>
                      <Badge variant="outline">{q.category || 'General'}</Badge>
                      <Badge variant="primary">{q.marks} Mark{q.marks > 1 ? 's' : ''}</Badge>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {q.testTitle}
                      </span>
                    </div>

                    <h4 className="text-sm font-medium text-slate-900 dark:text-white leading-relaxed">
                      {q.questionText}
                    </h4>
                  </div>

                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setSelectedQuestion(q)}
                  >
                    View Details
                  </Button>
                </div>

                {/* Options Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {(q.options || []).map((opt, optIdx) => {
                    const isCorrect = q.correctAnswer === optIdx;
                    return (
                      <div
                        key={optIdx}
                        className={`px-3 py-2 rounded-lg text-xs flex items-center justify-between border ${
                          isCorrect
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium'
                            : 'bg-slate-50 dark:bg-navy-950 border-slate-200 dark:border-navy-750 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-bold text-[10px] text-slate-400">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          <span className="truncate">{opt}</span>
                        </div>
                        {isCorrect && (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 ml-1.5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Question Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Question"
      >
        <form onSubmit={handleAddQuestion} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Assign to Assessment
            </label>
            <select
              value={newQ.testId}
              onChange={(e) => setNewQ({ ...newQ, testId: e.target.value })}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="">-- Standalone (Question Bank Only) --</option>
              {tests.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title} ({t.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Question Text *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Enter the question statement..."
              value={newQ.questionText}
              onChange={(e) => setNewQ({ ...newQ, questionText: e.target.value })}
              className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-electric-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Answer Options & Correct Answer
            </label>
            {newQ.options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correctOption"
                  checked={newQ.correctAnswer === idx}
                  onChange={() => setNewQ({ ...newQ, correctAnswer: idx })}
                  title="Mark as correct answer"
                  className="w-4 h-4 text-electric-600 focus:ring-electric-500 cursor-pointer"
                />
                <input
                  type="text"
                  required
                  placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  className="flex-1 py-1.5 px-3 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-200"
                />
              </div>
            ))}
          </div>

          <div className="w-32">
            <Input
              label="Marks"
              type="number"
              min={1}
              value={newQ.marks}
              onChange={(e) => setNewQ({ ...newQ, marks: parseInt(e.target.value, 10) || 1 })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={actionLoading}>
              Save Question
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Question Details Modal */}
      <Modal
        isOpen={!!selectedQuestion}
        onClose={() => setSelectedQuestion(null)}
        title="Question Details"
      >
        {selectedQuestion && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{selectedQuestion.category}</Badge>
              <Badge variant="primary">{selectedQuestion.marks} Marks</Badge>
              <span className="text-slate-400">• {selectedQuestion.testTitle}</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded-lg border border-slate-200 dark:border-navy-750 font-medium text-slate-900 dark:text-white">
              {selectedQuestion.questionText}
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                Options:
              </div>
              {selectedQuestion.options.map((opt, idx) => {
                const isCorrect = selectedQuestion.correctAnswer === idx;
                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border flex items-center justify-between ${
                      isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold'
                        : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-750 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>
                      {String.fromCharCode(65 + idx)}. {opt}
                    </span>
                    {isCorrect && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
                        Correct Answer
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedQuestion(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default QuestionBankView;
