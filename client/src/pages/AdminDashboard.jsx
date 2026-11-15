import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Card, { CardBody, CardHeader } from '../components/common/Card';
import StatCard from '../components/common/StatCard';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Loader from '../components/common/Loader';
import { AdminPerformanceChart } from '../components/dashboard/AdminCharts';
import testService from '../services/testService';
import {
  FileText,
  Users,
  CheckCircle2,
  TrendingUp,
  Plus,
  Trash2,
  Eye,
  AlertCircle,
  Clock,
  Search,
  Filter,
  BarChart3,
  Check,
  ChevronRight,
  Shield,
  Layers
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Sidebar & Layout State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmissionsModalOpen, setIsSubmissionsModalOpen] = useState(false);
  const [currentTestResults, setCurrentTestResults] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  // New Test Form State
  const initialTestState = {
    title: '',
    category: 'Technical',
    description: '',
    durationMinutes: 30,
    isActive: true,
    questions: [
      {
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        marks: 1
      }
    ]
  };
  const [newTest, setNewTest] = useState(initialTestState);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [statsData, testsData] = await Promise.all([
        testService.getDashboardStats(),
        testService.getTests()
      ]);
      setStats(statsData.stats);
      setTests(testsData.tests || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Tests
  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      const matchSearch =
        t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [tests, searchQuery, categoryFilter]);

  const uniqueCategories = useMemo(() => {
    const set = new Set(tests.map((t) => t.category).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [tests]);

  // Question manipulation
  const handleAddQuestion = () => {
    setNewTest({
      ...newTest,
      questions: [
        ...newTest.questions,
        {
          questionText: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          marks: 1
        }
      ]
    });
  };

  const handleRemoveQuestion = (index) => {
    if (newTest.questions.length <= 1) return;
    const updated = newTest.questions.filter((_, idx) => idx !== index);
    setNewTest({ ...newTest, questions: updated });
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...newTest.questions];
    updated[index][field] = value;
    setNewTest({ ...newTest, questions: updated });
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const updated = [...newTest.questions];
    updated[qIndex].options[optIndex] = value;
    setNewTest({ ...newTest, questions: updated });
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    if (!newTest.title.trim()) {
      alert('Please provide a test title');
      return;
    }

    for (let i = 0; i < newTest.questions.length; i++) {
      const q = newTest.questions[i];
      if (!q.questionText.trim()) {
        alert(`Question #${i + 1} text cannot be empty`);
        return;
      }
      if (q.options.some((opt) => !opt.trim())) {
        alert(`All options for Question #${i + 1} must be filled`);
        return;
      }
    }

    try {
      setActionLoading(true);
      await testService.createTest(newTest);
      setIsCreateModalOpen(false);
      setNewTest(initialTestState);
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to create test');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTest = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? All submissions will also be deleted.`)) {
      return;
    }
    try {
      await testService.deleteTest(id);
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to delete test');
    }
  };

  const handleViewSubmissions = async (testId) => {
    try {
      setIsSubmissionsModalOpen(true);
      setResultsLoading(true);
      const data = await testService.getTestResultsAdmin(testId);
      setCurrentTestResults(data);
    } catch (err) {
      alert(err.message || 'Failed to load test submissions');
      setIsSubmissionsModalOpen(false);
    } finally {
      setResultsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex items-center justify-center">
        <Loader fullScreen message="Loading Campus Management Console..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex transition-colors">
      {/* SaaS Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Header
          onOpenSidebar={() => setSidebarOpen(true)}
          title="Admin Management Console"
          subtitle="Oversee campus assessments, track submission performance and student metrics"
          searchVal={searchQuery}
          setSearchVal={setSearchQuery}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2.5 shadow-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Platform Performance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time metrics connected to Supabase PostgreSQL database
              </p>
            </div>

            <Button
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
              icon={Plus}
              className="shadow-sm hover:shadow-glow-sm self-start sm:self-auto"
            >
              Create Assessment
            </Button>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Assessments"
              value={stats?.totalTests || 0}
              subtitle="Active & draft evaluations"
              icon={FileText}
              accentColor="electric"
              badgeText="Published"
            />
            <StatCard
              title="Registered Students"
              value={stats?.totalStudents || 0}
              subtitle="Verified college student profiles"
              icon={Users}
              accentColor="navy"
              badgeText="Students"
            />
            <StatCard
              title="Total Submissions"
              value={stats?.totalSubmissions || 0}
              subtitle="Completed evaluations recorded"
              icon={CheckCircle2}
              accentColor="emerald"
              badgeText="Completed"
            />
            <StatCard
              title="Average Pass Rate"
              value={`${stats?.passRate || 0}%`}
              subtitle="Overall cohort success rate"
              icon={TrendingUp}
              accentColor="amber"
              badgeText="Threshold ≥40%"
            />
          </div>

          {/* Professional Performance Charts */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-electric-600 dark:text-electric-400" />
                Analytics & Trends
              </h3>
            </div>
            <AdminPerformanceChart tests={tests} recentResults={stats?.recentResults || []} />
          </div>

          {/* Assessments Data Table */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Assessment Management
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Showing {filteredTests.length} of {tests.length} tests
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="text-xs bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-750 text-slate-700 dark:text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-electric-500 font-medium"
                  >
                    {uniqueCategories.map((c) => (
                      <option key={c} value={c}>
                        {c === 'ALL' ? 'All Categories' : c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <Card>
              <div className="overflow-x-auto">
                {filteredTests.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 dark:text-slate-500 space-y-3">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-navy-700" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      No matching assessments found
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Try clearing filters or create a new assessment.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-navy-800 bg-slate-50/70 dark:bg-navy-850/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <th className="px-5 py-3">Assessment Title</th>
                        <th className="px-5 py-3">Category</th>
                        <th className="px-5 py-3">Duration</th>
                        <th className="px-5 py-3">Format</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-xs">
                      {filteredTests.map((test) => (
                        <tr
                          key={test._id}
                          className="hover:bg-slate-50/80 dark:hover:bg-navy-850/50 transition-colors"
                        >
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {test.title}
                            </div>
                            {test.description && (
                              <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-sm mt-0.5">
                                {test.description}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge variant="primary" size="sm">
                              {test.category}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                            <span className="inline-flex items-center gap-1.5 font-medium">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {test.durationMinutes} mins
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {test.questions?.length || 0}
                            </span>{' '}
                            Questions ({test.totalMarks} pts)
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge
                              variant={test.isActive ? 'success' : 'default'}
                              dot
                              size="sm"
                            >
                              {test.isActive ? 'Active' : 'Draft'}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5 text-right space-x-1.5">
                            <Button
                              variant="secondary"
                              size="xs"
                              onClick={() => handleViewSubmissions(test._id)}
                              icon={Eye}
                              title="View student submissions"
                            >
                              Results
                            </Button>
                            <Button
                              variant="danger"
                              size="xs"
                              onClick={() => handleDeleteTest(test._id, test.title)}
                              icon={Trash2}
                              title="Delete test"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          </div>
        </main>
      </div>

      {/* Create Assessment Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Campus Assessment"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateTest} className="space-y-5 max-h-[75vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Assessment Title"
              required
              placeholder="e.g. Distributed Systems & React Fundamentals"
              value={newTest.title}
              onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
            />
            <Input
              label="Subject Domain / Category"
              required
              placeholder="e.g. Technical, Aptitude, Core"
              value={newTest.category}
              onChange={(e) => setNewTest({ ...newTest, category: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Duration (Minutes)"
              type="number"
              min="1"
              required
              value={newTest.durationMinutes}
              onChange={(e) => setNewTest({ ...newTest, durationMinutes: Number(e.target.value) })}
            />
            <div className="flex flex-col justify-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                Visibility Status
              </label>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={newTest.isActive}
                  onChange={(e) => setNewTest({ ...newTest, isActive: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="relative w-10 h-5 bg-slate-300 dark:bg-navy-750 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-electric-600"></div>
                <span className="ms-3 text-xs font-medium text-slate-700 dark:text-slate-300">
                  {newTest.isActive ? 'Active (Open for student submission)' : 'Draft (Saved as hidden draft)'}
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Description & Instructions (Optional)
            </label>
            <textarea
              rows="2"
              className="w-full px-3.5 py-2 text-xs bg-white dark:bg-navy-850 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-navy-750 rounded-lg shadow-xs focus:outline-none focus:ring-1 focus:ring-electric-500"
              placeholder="Provide context, syllabus, or instructions..."
              value={newTest.description}
              onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
            />
          </div>

          {/* Question Builder */}
          <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-navy-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Questions ({newTest.questions.length})
              </h4>
              <Button type="button" variant="outline" size="xs" onClick={handleAddQuestion} icon={Plus}>
                Add Question
              </Button>
            </div>

            {newTest.questions.map((q, qIndex) => (
              <div
                key={qIndex}
                className="p-4 bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-navy-750 rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-electric-600 dark:text-electric-400 uppercase tracking-wider">
                    Question #{qIndex + 1}
                  </span>
                  {newTest.questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIndex)}
                      className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-semibold"
                    >
                      Delete
                    </button>
                  )}
                </div>

                <Input
                  placeholder="Enter the question description..."
                  value={q.questionText}
                  onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                  required
                />

                <div className="space-y-2 pt-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Options (Select radio button for the single correct answer)
                  </label>
                  {q.options.map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={q.correctAnswer === optIndex}
                        onChange={() => handleQuestionChange(qIndex, 'correctAnswer', optIndex)}
                        className="w-4 h-4 text-electric-600 focus:ring-electric-500 cursor-pointer"
                        title="Mark as correct answer"
                      />
                      <input
                        type="text"
                        placeholder={`Option ${optIndex + 1}`}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-electric-500"
                        value={opt}
                        onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-navy-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={actionLoading}>
              Publish Assessment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Submissions Modal */}
      <Modal
        isOpen={isSubmissionsModalOpen}
        onClose={() => setIsSubmissionsModalOpen(false)}
        title={`Student Performance - ${currentTestResults?.test?.title || ''}`}
        maxWidth="max-w-2xl"
      >
        {resultsLoading ? (
          <Loader message="Loading student score records..." />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-navy-800">
              <span>Max Marks: <strong className="text-slate-900 dark:text-white">{currentTestResults?.test?.totalMarks}</strong></span>
              <span>Passing: <strong className="text-slate-900 dark:text-white">{currentTestResults?.test?.passMarks}</strong></span>
              <span>Submissions: <strong className="text-slate-900 dark:text-white">{currentTestResults?.count || 0}</strong></span>
            </div>

            {currentTestResults?.results?.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 space-y-1">
                <p className="text-xs font-semibold">No students have taken this assessment yet.</p>
                <p className="text-[11px]">When a student submits, their score will populate here automatically.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-navy-800 max-h-96 overflow-y-auto">
                {currentTestResults?.results?.map((res) => (
                  <div key={res._id} className="py-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {res.student?.name || 'Student'}
                      </h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {res.student?.email}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {res.score} / {res.totalMarks}
                        </span>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">
                          {Math.round((res.score / (res.totalMarks || 1)) * 100)}%
                        </div>
                      </div>
                      <Badge variant={res.passed ? 'success' : 'danger'} size="sm" dot>
                        {res.passed ? 'PASSED' : 'FAILED'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminDashboard;
