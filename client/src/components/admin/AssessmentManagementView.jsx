import React, { useState, useEffect } from 'react';
import Card, { CardBody, CardHeader } from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import Loader from '../common/Loader';
import QuestionBuilder, { createDefaultQuestion } from './QuestionBuilder';
import testService from '../../services/testService';
import adminService from '../../services/adminService';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  Clock,
  Calendar,
  Send,
  Users,
  Settings,
  AlertCircle,
  Archive,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';

const AssessmentManagementView = () => {
  const [tests, setTests] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters & Search
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, published, draft, archived

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTestId, setEditingTestId] = useState(null);
  const [modalTab, setModalTab] = useState('basic'); // 'basic' | 'questions' | 'settings' | 'assignments'
  const [actionLoading, setActionLoading] = useState(false);

  // Submissions Modal State
  const [isSubmissionsOpen, setIsSubmissionsOpen] = useState(false);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [currentTestResults, setCurrentTestResults] = useState(null);

  // Assessment Form State
  const initialFormState = {
    title: '',
    category: 'Technical',
    description: '',
    durationMinutes: 30,
    passMarks: 10,
    totalMarks: 25,
    status: 'published', // 'published', 'draft', 'archived'
    isActive: true,
    settings: {
      negativeMarking: false,
      negativeMarkValue: 0.25,
      allowRetakes: false,
      maxRetakes: 1,
      releaseResultsImmediately: true,
      releaseDate: '',
      scheduledStartTime: '',
      scheduledEndTime: '',
      targetClass: 'All Batches',
    },
    questions: [createDefaultQuestion('multiple_choice')],
    assignStudents: [], // array of student UUIDs
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [testsRes, studRes] = await Promise.all([
        testService.getTests(),
        adminService.getStudents().catch(() => ({ students: [] }))
      ]);
      setTests(testsRes.tests || []);
      setStudents(studRes.students || []);
    } catch (err) {
      setError(err.message || 'Failed to load assessments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingTestId(null);
    setFormData(initialFormState);
    setModalTab('basic');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (test) => {
    setEditingTestId(test.id || test._id);
    const totalQMarks = (test.questions || []).reduce((s, q) => s + (Number(q.marks) || 1), 0);

    setFormData({
      title: test.title || '',
      category: test.category || 'Technical',
      description: test.description || '',
      durationMinutes: test.durationMinutes || test.duration_minutes || 30,
      passMarks: test.passMarks || test.pass_marks || 10,
      totalMarks: test.totalMarks || test.total_marks || totalQMarks,
      status: test.status || (test.isActive ? 'published' : 'draft'),
      isActive: test.isActive !== undefined ? test.isActive : true,
      settings: {
        negativeMarking: !!test.settings?.negativeMarking,
        negativeMarkValue: test.settings?.negativeMarkValue || 0.25,
        allowRetakes: !!test.settings?.allowRetakes,
        maxRetakes: test.settings?.maxRetakes || 1,
        releaseResultsImmediately: test.settings?.releaseResultsImmediately !== undefined ? test.settings.releaseResultsImmediately : true,
        releaseDate: test.settings?.releaseDate ? test.settings.releaseDate.substring(0, 16) : '',
        scheduledStartTime: test.settings?.scheduledStartTime ? test.settings.scheduledStartTime.substring(0, 16) : '',
        scheduledEndTime: test.settings?.scheduledEndTime ? test.settings.scheduledEndTime.substring(0, 16) : '',
        targetClass: test.settings?.targetClass || 'All Batches',
      },
      questions: Array.isArray(test.questions) && test.questions.length > 0 ? test.questions : [createDefaultQuestion('multiple_choice')],
      assignStudents: [],
    });
    setModalTab('basic');
    setIsModalOpen(true);
  };

  // Save / Publish / Update Assessment
  const handleSaveAssessment = async (targetStatus = 'published') => {
    if (!formData.title.trim()) {
      alert('Please provide an assessment title.');
      setModalTab('basic');
      return;
    }

    if (!formData.durationMinutes || formData.durationMinutes <= 0) {
      alert('Please specify a positive examination duration.');
      setModalTab('basic');
      return;
    }

    if (!formData.questions || formData.questions.length === 0) {
      alert('Assessment must contain at least 1 question.');
      setModalTab('questions');
      return;
    }

    try {
      setActionLoading(true);
      const computedTotal = formData.questions.reduce((s, q) => s + (Number(q.marks) || 1), 0);
      const payload = {
        ...formData,
        status: targetStatus,
        isActive: targetStatus === 'published',
        totalMarks: computedTotal,
        passMarks: Number(formData.passMarks) || Math.ceil(computedTotal * 0.4)
      };

      if (editingTestId) {
        await testService.updateTest(editingTestId, payload);
        setSuccessMsg(`Assessment "${formData.title}" updated successfully.`);
      } else {
        await testService.createTest(payload);
        setSuccessMsg(`Assessment "${formData.title}" created successfully.`);
      }

      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      alert(err.message || 'Operation failed. Please check your inputs.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete assessment permanently
  const handleDeleteTest = async (testId, title) => {
    if (!window.confirm(`Permanently delete "${title}"? All student attempts, scores, and assignments will be removed.`)) {
      return;
    }
    try {
      await testService.deleteTest(testId);
      setSuccessMsg(`Assessment "${title}" deleted.`);
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to delete assessment');
    }
  };

  // Archive or Unarchive assessment
  const handleArchiveTest = async (testId, title) => {
    if (!window.confirm(`Archive "${title}"? Students will no longer see this assessment.`)) {
      return;
    }
    try {
      await testService.updateTest(testId, { status: 'archived', isActive: false });
      setSuccessMsg(`Assessment "${title}" archived.`);
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to archive assessment');
    }
  };

  // Quick toggle status: Draft -> Publish
  const handlePublishTest = async (testId, title) => {
    try {
      await testService.updateTest(testId, { status: 'published', isActive: true });
      setSuccessMsg(`Assessment "${title}" is now published and active.`);
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to publish assessment');
    }
  };

  // View Submissions
  const handleViewSubmissions = async (testId) => {
    try {
      setIsSubmissionsOpen(true);
      setSubmissionsLoading(true);
      const res = await testService.getTestResultsAdmin(testId);
      setCurrentTestResults(res);
    } catch (err) {
      alert(err.message || 'Failed to load test submissions');
      setIsSubmissionsOpen(false);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  // Filtered assessments list
  const filteredTests = tests.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch = t.title?.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
    const matchesCat = categoryFilter === 'ALL' || t.category?.toLowerCase() === categoryFilter.toLowerCase();
    const effectiveStatus = t.status || (t.isActive ? 'published' : 'draft');
    const matchesStatus = statusFilter === 'ALL' || effectiveStatus.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesCat && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800">×</button>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Control Banner */}
      <Card className="border-slate-200 dark:border-navy-800">
        <CardBody className="p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search assessments by title or skill..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-electric-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-950 text-slate-700 dark:text-slate-300 font-medium"
            >
              <option value="ALL">All Categories</option>
              <option value="Technical">Technical</option>
              <option value="Coding">Coding</option>
              <option value="Debugging">Debugging</option>
              <option value="Aptitude">Aptitude</option>
              <option value="SQL">SQL</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-950 text-slate-700 dark:text-slate-300 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchData} className="text-xs">
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={handleOpenCreate} className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Create Assessment
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Assessments Grid */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader message="Loading institutional assessments..." />
        </div>
      ) : filteredTests.length === 0 ? (
        <Card className="border-slate-200 dark:border-navy-800 text-center py-12">
          <CardBody className="space-y-3">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No assessments match your filters</h3>
            <p className="text-xs text-slate-400">Click "Create Assessment" to launch a new evaluation.</p>
            <Button variant="primary" size="sm" onClick={handleOpenCreate} className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Create First Assessment
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTests.map((t) => {
            const effectiveStatus = t.status || (t.isActive ? 'published' : 'draft');
            const qCount = Array.isArray(t.questions) ? t.questions.length : 0;
            const testId = t.id || t._id;

            return (
              <Card key={testId} hover className="border-slate-200 dark:border-navy-800 flex flex-col justify-between">
                <CardBody className="p-5 space-y-4">
                  {/* Category & Status Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                      {t.category || 'Technical'}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      {effectiveStatus === 'published' && (
                        <Badge variant="success" dot className="text-[10px] font-semibold">
                          Published
                        </Badge>
                      )}
                      {effectiveStatus === 'draft' && (
                        <Badge variant="secondary" dot className="text-[10px] font-semibold">
                          Draft
                        </Badge>
                      )}
                      {effectiveStatus === 'archived' && (
                        <Badge variant="danger" dot className="text-[10px] font-semibold">
                          Archived
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                      {t.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {t.description || 'Institutional college evaluation assessment.'}
                    </p>
                  </div>

                  {/* Assessment Rules / Config Capsule */}
                  <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded-xl border border-slate-100 dark:border-navy-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> Duration:
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {t.durationMinutes || t.duration_minutes || 30} Mins
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px] flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400" /> Structure:
                      </span>
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {qCount} Questions • {t.totalMarks || t.total_marks || 0} Pts
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-navy-850">
                      <span className="text-slate-500 text-[11px]">Pass Threshold:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {t.passMarks || t.pass_marks || 0} Pts ({Math.round(((t.passMarks || 1) / (t.totalMarks || 1)) * 100)}%)
                      </span>
                    </div>

                    {/* Feature Indicators */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-navy-850 flex items-center gap-1.5 flex-wrap text-[10px]">
                      {t.settings?.negativeMarking && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-semibold">
                          -Marking ({t.settings.negativeMarkValue})
                        </span>
                      )}
                      {t.settings?.allowRetakes && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold">
                          Retakes ({t.settings.maxRetakes}x)
                        </span>
                      )}
                      {t.settings?.scheduledStartTime && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-semibold">
                          Scheduled
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Toolbar */}
                  <div className="pt-2 flex items-center justify-between gap-1 border-t border-slate-100 dark:border-navy-800">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleViewSubmissions(testId)}
                      className="text-xs text-slate-600 dark:text-slate-300"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" /> Results
                    </Button>

                    <div className="flex items-center gap-1">
                      {effectiveStatus === 'draft' && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handlePublishTest(testId, t.title)}
                          className="text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Publish
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleOpenEdit(t)}
                        className="text-xs text-electric-600 dark:text-electric-400"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>

                      {effectiveStatus !== 'archived' ? (
                        <button
                          type="button"
                          onClick={() => handleArchiveTest(testId, t.title)}
                          title="Archive assessment"
                          className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg transition-colors"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => handleDeleteTest(testId, t.title)}
                        title="Delete permanently"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── CREATE / EDIT ASSESSMENT MODAL ───────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTestId ? 'Edit Assessment' : 'Create New Assessment'}
        size="xl"
      >
        <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
          {/* Wizard Tabs */}
          <div className="flex border-b border-slate-200 dark:border-navy-800 text-xs font-semibold">
            {[
              { id: 'basic', label: '1. Basic Details' },
              { id: 'questions', label: `2. Question Bank (${formData.questions?.length || 0})` },
              { id: 'settings', label: '3. Rules & Schedule' },
              { id: 'assignments', label: `4. Target Students (${formData.assignStudents?.length || 0})` }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setModalTab(tab.id)}
                className={`py-2.5 px-4 border-b-2 transition-colors ${
                  modalTab === tab.id
                    ? 'border-electric-600 text-electric-600 dark:text-electric-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: BASIC DETAILS */}
          {modalTab === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assessment Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Advanced Data Structures & Algorithmic Sprint"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assessment Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-950 text-slate-800 dark:text-slate-200"
                  >
                    <option value="Technical">Technical MCQ</option>
                    <option value="Coding">Coding Arena</option>
                    <option value="Debugging">Debugging Arena</option>
                    <option value="Aptitude">Aptitude & Reasoning</option>
                    <option value="SQL">SQL & Database</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duration (Minutes) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: Math.max(1, parseInt(e.target.value) || 30) })}
                    className="w-full py-2 px-3 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Passing Score Threshold (Marks)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.passMarks}
                    onChange={(e) => setFormData({ ...formData, passMarks: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full py-2 px-3 text-xs font-mono rounded-lg border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Class / Batch
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CS 2026 - Batch A"
                    value={formData.settings.targetClass}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, targetClass: e.target.value }
                    })}
                    className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Instructions for Candidates
                </label>
                <textarea
                  rows={3}
                  placeholder="Outline topics covered, test rules, and instructions..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end pt-3">
                <Button variant="primary" size="sm" onClick={() => setModalTab('questions')} className="text-xs">
                  Next: Add Questions →
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: QUESTIONS BUILDER */}
          {modalTab === 'questions' && (
            <div className="space-y-4">
              <QuestionBuilder
                questions={formData.questions || []}
                onChange={(updatedQuestions) => setFormData({ ...formData, questions: updatedQuestions })}
              />

              <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-navy-800">
                <Button variant="secondary" size="sm" onClick={() => setModalTab('basic')} className="text-xs">
                  ← Back to Basic Details
                </Button>
                <Button variant="primary" size="sm" onClick={() => setModalTab('settings')} className="text-xs">
                  Next: Configure Rules & Schedule →
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3: RULES & SCHEDULING CONFIG */}
          {modalTab === 'settings' && (
            <div className="space-y-5">
              {/* Negative Marking */}
              <div className="p-4 bg-slate-50 dark:bg-navy-950 rounded-xl border border-slate-200/80 dark:border-navy-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      Negative Marking Policy
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Penalize candidates for incorrect answer submissions
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.settings.negativeMarking}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: { ...formData.settings, negativeMarking: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-navy-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-electric-600"></div>
                  </label>
                </div>

                {formData.settings.negativeMarking && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-navy-850">
                    <span className="text-xs text-slate-600 dark:text-slate-300">Penalty per incorrect MCQ:</span>
                    <select
                      value={formData.settings.negativeMarkValue}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: { ...formData.settings, negativeMarkValue: parseFloat(e.target.value) }
                      })}
                      className="py-1 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200 font-mono"
                    >
                      <option value="0.25">-0.25 Marks (25%)</option>
                      <option value="0.33">-0.33 Marks (1/3rd)</option>
                      <option value="0.50">-0.50 Marks (50%)</option>
                      <option value="1.00">-1.00 Mark (Full)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Retakes Policy */}
              <div className="p-4 bg-slate-50 dark:bg-navy-950 rounded-xl border border-slate-200/80 dark:border-navy-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      Candidate Retake Attempts
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Permit students to retake the test if initial performance is below threshold
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.settings.allowRetakes}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: { ...formData.settings, allowRetakes: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-navy-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-electric-600"></div>
                  </label>
                </div>

                {formData.settings.allowRetakes && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-navy-850">
                    <span className="text-xs text-slate-600 dark:text-slate-300">Maximum Allowed Attempts:</span>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={formData.settings.maxRetakes}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: { ...formData.settings, maxRetakes: Math.max(1, parseInt(e.target.value) || 1) }
                      })}
                      className="w-16 py-1 px-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200 text-center"
                    />
                  </div>
                )}
              </div>

              {/* Result Release Configuration */}
              <div className="p-4 bg-slate-50 dark:bg-navy-950 rounded-xl border border-slate-200/80 dark:border-navy-800 space-y-3">
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                    Score & Result Release Configuration
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Control when candidates can view detailed scorecards and answer breakdowns
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="releaseResults"
                      checked={formData.settings.releaseResultsImmediately}
                      onChange={() => setFormData({
                        ...formData,
                        settings: { ...formData.settings, releaseResultsImmediately: true }
                      })}
                      className="w-4 h-4 text-electric-600"
                    />
                    <span>Immediate Release (Show score & review right after submission)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="releaseResults"
                      checked={!formData.settings.releaseResultsImmediately}
                      onChange={() => setFormData({
                        ...formData,
                        settings: { ...formData.settings, releaseResultsImmediately: false }
                      })}
                      className="w-4 h-4 text-electric-600"
                    />
                    <span>Scheduled Release (Withhold scores until official announcement date)</span>
                  </label>

                  {!formData.settings.releaseResultsImmediately && (
                    <div className="pl-6 pt-2">
                      <span className="text-[11px] text-slate-500 block mb-1">Release Timestamp:</span>
                      <input
                        type="datetime-local"
                        value={formData.settings.releaseDate}
                        onChange={(e) => setFormData({
                          ...formData,
                          settings: { ...formData.settings, releaseDate: e.target.value }
                        })}
                        className="py-1 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200 font-mono"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Assessment Window Scheduling */}
              <div className="p-4 bg-slate-50 dark:bg-navy-950 rounded-xl border border-slate-200/80 dark:border-navy-800 space-y-3">
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                    Examination Schedule Window (Optional)
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Restrict examination access to a strict date/time window
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">Start Time (Window Open):</span>
                    <input
                      type="datetime-local"
                      value={formData.settings.scheduledStartTime}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: { ...formData.settings, scheduledStartTime: e.target.value }
                      })}
                      className="w-full py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">End Time (Deadline):</span>
                    <input
                      type="datetime-local"
                      value={formData.settings.scheduledEndTime}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: { ...formData.settings, scheduledEndTime: e.target.value }
                      })}
                      className="w-full py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-navy-800">
                <Button variant="secondary" size="sm" onClick={() => setModalTab('questions')} className="text-xs">
                  ← Back to Questions
                </Button>
                <Button variant="primary" size="sm" onClick={() => setModalTab('assignments')} className="text-xs">
                  Next: Assign Students →
                </Button>
              </div>
            </div>
          )}

          {/* TAB 4: ASSIGN STUDENTS */}
          {modalTab === 'assignments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                    Assign Students to Assessment
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Select individual students or assign all enrolled students
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      const allIds = students.map((s) => s.id || s._id);
                      setFormData({ ...formData, assignStudents: allIds });
                    }}
                    className="text-xs"
                  >
                    Select All ({students.length})
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setFormData({ ...formData, assignStudents: [] })}
                    className="text-xs"
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>

              {/* Student Selection List */}
              <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-navy-750 rounded-xl divide-y divide-slate-100 dark:divide-navy-800">
                {students.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No students currently enrolled. You can assign students later in "Test Assignment".
                  </div>
                ) : (
                  students.map((stud) => {
                    const sid = stud.id || stud._id;
                    const isSelected = (formData.assignStudents || []).includes(sid);

                    return (
                      <label
                        key={sid}
                        className={`p-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-navy-900 ${
                          isSelected ? 'bg-electric-50/50 dark:bg-electric-950/30' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, assignStudents: [...(formData.assignStudents || []), sid] });
                              } else {
                                setFormData({
                                  ...formData,
                                  assignStudents: (formData.assignStudents || []).filter((id) => id !== sid)
                                });
                              }
                            }}
                            className="w-4 h-4 text-electric-600 rounded"
                          />
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white block">
                              {stud.name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {stud.email}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" size="sm">Student</Badge>
                      </label>
                    );
                  })
                )}
              </div>

              {/* Action Buttons: Draft vs Publish */}
              <div className="pt-4 border-t border-slate-100 dark:border-navy-800 flex flex-wrap items-center justify-between gap-2">
                <Button variant="secondary" size="sm" onClick={() => setModalTab('settings')} className="text-xs">
                  ← Back to Rules
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSaveAssessment('draft')}
                    disabled={actionLoading}
                    className="text-xs"
                  >
                    Save as Draft
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleSaveAssessment('published')}
                    isLoading={actionLoading}
                    className="text-xs font-semibold"
                  >
                    Publish Assessment Now
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ── SUBMISSIONS MODAL ────────────────────────────────────────────── */}
      <Modal
        isOpen={isSubmissionsOpen}
        onClose={() => setIsSubmissionsOpen(false)}
        title={`Submissions: ${currentTestResults?.test?.title || ''}`}
        size="lg"
      >
        <div className="space-y-4">
          {submissionsLoading ? (
            <div className="py-12 flex justify-center">
              <Loader message="Loading submissions..." />
            </div>
          ) : !currentTestResults?.results || currentTestResults.results.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No students have submitted answers for this assessment yet.
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-navy-850 text-slate-500 uppercase text-[10px] font-semibold sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Score</th>
                    <th className="py-2.5 px-3">Accuracy</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Time Taken</th>
                    <th className="py-2.5 px-3">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                  {currentTestResults.results.map((r) => {
                    const pct = Math.round(((r.score || 0) / (r.totalMarks || 1)) * 100);
                    return (
                      <tr key={r._id || r.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-900/50">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            {r.student?.name || 'Student'}
                          </span>
                          <span className="text-[10px] text-slate-400">{r.student?.email}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {r.score} / {r.totalMarks}
                        </td>
                        <td className="py-2.5 px-3 font-mono">{pct}%</td>
                        <td className="py-2.5 px-3">
                          <Badge variant={r.passed ? 'success' : 'danger'}>
                            {r.passed ? 'Passed' : 'Failed'}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                          {Math.round(r.timeTakenSeconds / 60)} min
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-navy-800">
            <Button variant="outline" size="sm" onClick={() => setIsSubmissionsOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssessmentManagementView;
