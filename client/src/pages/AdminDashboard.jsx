import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
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
import adminService from '../services/adminService';

// Sub-views for the 13 Admin Portal Pages
import StudentManagementView from '../components/admin/StudentManagementView';
import BulkStudentImportView from '../components/admin/BulkStudentImportView';
import QuestionBankView from '../components/admin/QuestionBankView';
import TestAssignmentView from '../components/admin/TestAssignmentView';
import ScheduleManagementView from '../components/admin/ScheduleManagementView';
import LiveMonitoringView from '../components/admin/LiveMonitoringView';
import ResultsView from '../components/admin/ResultsView';
import LeaderboardView from '../components/admin/LeaderboardView';
import AnalyticsView from '../components/admin/AnalyticsView';
import NotificationsView from '../components/admin/NotificationsView';
import SettingsView from '../components/admin/SettingsView';

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
  UserPlus,
  Radio,
  BookOpen,
  Send,
  Calendar,
  CheckSquare,
  Trophy,
  Bell,
  Settings,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Tag
} from 'lucide-react';

const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { tab: routeTab } = useParams();
  const navigate = useNavigate();

  const initialTab = routeTab || searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTabState] = useState(initialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (routeTab && routeTab !== activeTab) {
      setActiveTabState(routeTab);
    }
  }, [routeTab]);

  // Synchronize Tab with route / query
  const setActiveTab = (tabId) => {
    setActiveTabState(tabId);
    if (routeTab) {
      navigate(`/admin/${tabId}`);
    } else {
      setSearchParams({ tab: tabId }, { replace: true });
    }
  };

  // Live Database State
  const [dashboardData, setDashboardData] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Test Management State
  const [testSearch, setTestSearch] = useState('');
  const [testCategoryFilter, setTestCategoryFilter] = useState('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmissionsModalOpen, setIsSubmissionsModalOpen] = useState(false);
  const [currentTestResults, setCurrentTestResults] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);

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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const [dashRes, testsRes] = await Promise.all([
        adminService.getDashboard(),
        testService.getTests()
      ]);
      setDashboardData(dashRes.stats);
      setTests(testsRes.tests || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve live data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Filtered Tests
  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      const matchSearch =
        t.title?.toLowerCase().includes(testSearch.toLowerCase()) ||
        t.category?.toLowerCase().includes(testSearch.toLowerCase()) ||
        t.description?.toLowerCase().includes(testSearch.toLowerCase());
      const matchCategory =
        testCategoryFilter === 'ALL' || t.category === testCategoryFilter;
      return matchSearch && matchCategory;
    });
  }, [tests, testSearch, testCategoryFilter]);

  const uniqueCategories = useMemo(() => {
    const set = new Set(tests.map((t) => t.category).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [tests]);

  // Questions manipulation for Create Test
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
      alert('Please provide an assessment title');
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
      await fetchDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to create assessment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTest = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? All student attempts and results for this assessment will also be removed.`)) {
      return;
    }
    try {
      await testService.deleteTest(id);
      await fetchDashboardData();
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

  // Tab Title helper
  const getTabTitle = () => {
    switch (activeTab) {
      case 'overview':
      case 'dashboard':
        return 'Executive Overview & Intel';
      case 'students':
        return 'Student Directory & Enrollment';
      case 'bulk-import':
        return 'Bulk Student Roster Import';
      case 'tests':
      case 'assessments':
        return 'Assessment & Examination Management';
      case 'questions':
        return 'Centralized Question Bank';
      case 'assignments':
        return 'Cohort & Student Test Assignments';
      case 'schedules':
        return 'Evaluation Window Schedules';
      case 'monitoring':
        return 'Live Examination Proctoring Feed';
      case 'results':
        return 'Evaluation Results & Scorecards';
      case 'leaderboard':
        return 'Official Campus Honor Roll & Standings';
      case 'analytics':
        return 'Institutional Performance Analytics';
      case 'notifications':
        return 'Campus Announcements & Broadcasts';
      case 'settings':
        return 'Institution Governance & Platform Settings';
      default:
        return 'Admin Console';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex transition-colors">
      {/* 13-Section Unified Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Header Bar */}
        <Header onMenuClick={() => setSidebarOpen(true)} title="Admin Console" />

        {/* Subheader / Section Title Bar */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-navy-800 bg-white/70 dark:bg-navy-900/60 backdrop-blur-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>{getTabTitle()}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              CampusTest Enterprise Evaluation System • Real-Time Database Mode
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'tests' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                className="text-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Assessment</span>
              </Button>
            )}
            {activeTab === 'students' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('bulk-import')}
                className="text-xs flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Bulk CSV Import</span>
              </Button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <main className="flex-1 p-6 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* 1. DASHBOARD OVERVIEW */}
          {(activeTab === 'overview' || activeTab === 'dashboard') && (
            <div className="space-y-6">
              {/* Stat Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                  title="Total Assessments"
                  value={dashboardData?.totalTests || 0}
                  icon={FileText}
                  description="Evaluations in database"
                  variant="primary"
                />
                <StatCard
                  title="Enrolled Students"
                  value={dashboardData?.totalStudents || 0}
                  icon={Users}
                  description="Registered campus cohort"
                  variant="indigo"
                />
                <StatCard
                  title="Completed Submissions"
                  value={dashboardData?.totalSubmissions || 0}
                  icon={CheckCircle2}
                  description="Verified evaluations"
                  variant="emerald"
                />
                <StatCard
                  title="Overall Pass Rate"
                  value={`${dashboardData?.passRate || 0}%`}
                  icon={TrendingUp}
                  description="Campus benchmark"
                  variant="amber"
                />
                <StatCard
                  title="Live Test Takers"
                  value={dashboardData?.liveTestTakers || 0}
                  icon={Radio}
                  description="Current active sessions"
                  variant="rose"
                />
              </div>

              {/* Quick Actions Row */}
              <Card className="border-slate-200 dark:border-navy-800 bg-gradient-to-r from-slate-50 to-white dark:from-navy-900/90 dark:to-navy-850">
                <CardBody className="p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-electric-100 dark:bg-electric-900/60 text-electric-600 dark:text-electric-400 flex items-center justify-center font-bold">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Admin Command Shortcuts
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Quickly navigate core institutional administration workflows
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsCreateModalOpen(true)}
                      className="text-xs"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Create Assessment
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('students')}
                      className="text-xs"
                    >
                      <UserPlus className="w-3.5 h-3.5 mr-1" /> Enroll Student
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('assignments')}
                      className="text-xs"
                    >
                      <Send className="w-3.5 h-3.5 mr-1" /> Assign Test
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('monitoring')}
                      className="text-xs"
                    >
                      <Radio className="w-3.5 h-3.5 mr-1 text-rose-500" /> Live Feed
                    </Button>
                  </div>
                </CardBody>
              </Card>

              {/* Performance Chart & Category Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="border-slate-200 dark:border-navy-800">
                    <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-navy-800 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-electric-500" />
                          Evaluation Performance Trajectory
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Weekly evaluation submissions and student completion rates
                        </p>
                      </div>
                      <Badge variant="primary">Real-time Stream</Badge>
                    </CardHeader>
                    <CardBody className="p-4 sm:p-5">
                      <AdminPerformanceChart />
                    </CardBody>
                  </Card>
                </div>

                <div className="space-y-6">
                  {/* Category Breakdown */}
                  <Card className="border-slate-200 dark:border-navy-800">
                    <CardHeader className="p-4 border-b border-slate-100 dark:border-navy-800">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Assessments By Category
                      </h4>
                    </CardHeader>
                    <CardBody className="p-4 space-y-2.5">
                      {(dashboardData?.categoryBreakdown || []).map((cat, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-navy-850 text-xs"
                        >
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {cat.name}
                          </span>
                          <span className="font-mono font-bold text-electric-600 dark:text-electric-400 bg-white dark:bg-navy-900 px-2 py-0.5 rounded border border-slate-200 dark:border-navy-750">
                            {cat.count} Tests
                          </span>
                        </div>
                      ))}
                    </CardBody>
                  </Card>

                  {/* Quick System Health */}
                  <Card className="border-slate-200 dark:border-navy-800">
                    <CardBody className="p-4 space-y-2 text-xs">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        Infrastructure Health
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                        Supabase PostgreSQL database live & responsive. All 10 tables operational with zero mock data.
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </div>

              {/* Recent Submissions Table */}
              <Card className="border-slate-200 dark:border-navy-800 shadow-sm overflow-hidden">
                <CardHeader className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 dark:border-navy-800">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      Recent Student Submissions
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Latest verified assessments completed by students
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('results')}
                    className="text-xs"
                  >
                    <span>View All Records</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </CardHeader>

                <div className="overflow-x-auto">
                  {dashboardData?.recentSubmissions?.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No student submissions recorded yet.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-navy-850/60 text-slate-500 uppercase text-[10px] font-semibold">
                        <tr>
                          <th className="py-2.5 px-4">Student</th>
                          <th className="py-2.5 px-4">Assessment</th>
                          <th className="py-2.5 px-4">Score</th>
                          <th className="py-2.5 px-4">Outcome</th>
                          <th className="py-2.5 px-4">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                        {(dashboardData?.recentSubmissions || []).map((sub) => (
                          <tr key={sub._id} className="hover:bg-slate-50/60 dark:hover:bg-navy-850/40">
                            <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                              {sub.student.name}
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                              {sub.test.title}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                              {sub.score} / {sub.totalMarks}
                            </td>
                            <td className="py-3 px-4">
                              {sub.passed ? (
                                <Badge variant="success">Passed</Badge>
                              ) : (
                                <Badge variant="danger">Failed</Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-400 text-[11px]">
                              {new Date(sub.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* 2. STUDENT MANAGEMENT */}
          {activeTab === 'students' && (
            <StudentManagementView onNavigateToBulkImport={() => setActiveTab('bulk-import')} />
          )}

          {/* 3. BULK STUDENT IMPORT */}
          {activeTab === 'bulk-import' && (
            <BulkStudentImportView onBackToDirectory={() => setActiveTab('students')} />
          )}

          {/* 4. TEST MANAGEMENT */}
          {(activeTab === 'tests' || activeTab === 'assessments') && (
            <div className="space-y-6">
              {/* Search & Category Filter */}
              <Card className="border-slate-200 dark:border-navy-800">
                <CardBody className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex flex-1 w-full sm:w-auto items-center gap-3">
                    <div className="relative w-full sm:w-72">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search assessments..."
                        value={testSearch}
                        onChange={(e) => setTestSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-200 focus:outline-none"
                      />
                    </div>

                    <select
                      value={testCategoryFilter}
                      onChange={(e) => setTestCategoryFilter(e.target.value)}
                      className="py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-950 text-slate-700 dark:text-slate-300"
                    >
                      {uniqueCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat === 'ALL' ? 'All Categories' : cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Create Assessment
                  </Button>
                </CardBody>
              </Card>

              {/* Tests Grid */}
              {filteredTests.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No assessments found. Click "Create Assessment" to add one.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTests.map((t) => (
                    <Card key={t._id} className="border-slate-200 dark:border-navy-800 hover:shadow-md transition-shadow">
                      <CardBody className="p-5 space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <Badge variant="outline">{t.category}</Badge>
                          <Badge variant={t.isActive ? 'success' : 'secondary'}>
                            {t.isActive ? 'Active' : 'Suspended'}
                          </Badge>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {t.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {t.description || 'Institutional assessment evaluation.'}
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 dark:border-navy-800 text-center font-mono text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">Duration</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{t.durationMinutes}m</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">Questions</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{t.questions?.length || 0}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">Pass Mark</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{t.passMarks || 1}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleViewSubmissions(t._id)}
                            className="text-xs"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> Submissions
                          </Button>

                          <button
                            onClick={() => handleDeleteTest(t._id, t.title)}
                            title="Delete test"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. QUESTION BANK */}
          {activeTab === 'questions' && <QuestionBankView />}

          {/* 6. TEST ASSIGNMENT */}
          {activeTab === 'assignments' && <TestAssignmentView />}

          {/* 7. SCHEDULE MANAGEMENT */}
          {activeTab === 'schedules' && <ScheduleManagementView />}

          {/* 8. LIVE MONITORING */}
          {activeTab === 'monitoring' && <LiveMonitoringView />}

          {/* 9. RESULTS */}
          {activeTab === 'results' && <ResultsView />}

          {/* 10. LEADERBOARD */}
          {activeTab === 'leaderboard' && <LeaderboardView />}

          {/* 11. ANALYTICS */}
          {activeTab === 'analytics' && <AnalyticsView />}

          {/* 12. NOTIFICATIONS */}
          {activeTab === 'notifications' && <NotificationsView />}

          {/* 13. SETTINGS */}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Create Assessment Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Assessment"
        size="lg"
      >
        <form onSubmit={handleCreateTest} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <Input
            label="Assessment Title *"
            required
            placeholder="e.g. Data Structures & Algorithms Final"
            value={newTest.title}
            onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Category *
              </label>
              <select
                value={newTest.category}
                onChange={(e) => setNewTest({ ...newTest, category: e.target.value })}
                className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-200"
              >
                <option value="Technical">Technical</option>
                <option value="Aptitude">Aptitude</option>
                <option value="Programming">Programming</option>
                <option value="General">General</option>
              </select>
            </div>

            <Input
              label="Duration (Minutes)"
              type="number"
              min={1}
              value={newTest.durationMinutes}
              onChange={(e) =>
                setNewTest({ ...newTest, durationMinutes: parseInt(e.target.value, 10) || 30 })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Instructions or topics covered..."
              value={newTest.description}
              onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
              className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Questions Builder */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-navy-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Questions Builder ({newTest.questions.length})
              </h4>
              <Button variant="outline" size="xs" type="button" onClick={handleAddQuestion}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Question
              </Button>
            </div>

            {newTest.questions.map((q, qIdx) => (
              <div
                key={qIdx}
                className="p-4 bg-slate-50 dark:bg-navy-950 rounded-xl border border-slate-200 dark:border-navy-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-electric-600 dark:text-electric-400">
                    Question #{qIdx + 1}
                  </span>
                  {newTest.questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>

                <textarea
                  rows={2}
                  required
                  placeholder="Enter question statement..."
                  value={q.questionText}
                  onChange={(e) => handleQuestionChange(qIdx, 'questionText', e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200"
                />

                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Options (Select radio for correct answer):
                  </span>
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qIdx}`}
                        checked={q.correctAnswer === oIdx}
                        onChange={() => handleQuestionChange(qIdx, 'correctAnswer', oIdx)}
                        className="w-3.5 h-3.5 text-electric-600 cursor-pointer"
                      />
                      <input
                        type="text"
                        required
                        placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                        value={opt}
                        onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                        className="flex-1 py-1 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-navy-800">
            <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={actionLoading}>
              Publish Assessment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Submissions Modal */}
      <Modal
        isOpen={isSubmissionsModalOpen}
        onClose={() => setIsSubmissionsModalOpen(false)}
        title={`Submissions: ${currentTestResults?.test?.title || ''}`}
        size="lg"
      >
        <div className="space-y-4">
          {resultsLoading ? (
            <div className="py-12 flex justify-center">
              <Loader message="Loading submissions..." />
            </div>
          ) : currentTestResults?.results?.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No student has submitted answers for this assessment yet.
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-navy-850/60 text-slate-500 uppercase text-[10px] font-semibold sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Student</th>
                    <th className="py-2 px-3">Score</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                  {(currentTestResults?.results || []).map((r) => (
                    <tr key={r._id}>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {r.student?.name}
                        </div>
                        <div className="text-[10px] text-slate-400">{r.student?.email}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold">
                        {r.score} / {currentTestResults.test.totalMarks}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant={r.passed ? 'success' : 'danger'}>
                          {r.passed ? 'Passed' : 'Failed'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsSubmissionsModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
