import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Card, { CardBody, CardHeader } from '../components/common/Card';
import StatCard from '../components/common/StatCard';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Loader from '../components/common/Loader';
import { StudentScoreTrajectory } from '../components/dashboard/StudentCharts';
import studentService from '../services/studentService';
import { useAuth } from '../context/AuthContext';

// Sub-views for the 13 Student Portal Pages
import AssignedTestsView from '../components/student/AssignedTestsView';
import StudentResultsView from '../components/student/StudentResultsView';
import StudentLeaderboardView from '../components/student/StudentLeaderboardView';
import StudentAnalyticsView from '../components/student/StudentAnalyticsView';
import StudentNotificationsView from '../components/student/StudentNotificationsView';
import StudentProfileView from '../components/student/StudentProfileView';

import {
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Calendar,
  Layers,
  Sparkles,
  Code2,
  Bug,
  Cpu,
  Brain,
  Database,
  User,
  Bell,
  CheckSquare,
  Trophy,
  BarChart3,
  FileText
} from 'lucide-react';

const StudentDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { tab: routeTab } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const initialTab = routeTab || searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTabState] = useState(initialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (routeTab && routeTab !== activeTab) {
      setActiveTabState(routeTab);
    }
  }, [routeTab]);

  const setActiveTab = (tabId) => {
    setActiveTabState(tabId);
    if (routeTab) {
      navigate(`/student/${tabId}`);
    } else {
      setSearchParams({ tab: tabId }, { replace: true });
    }
  };

  // Dashboard Data State
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await studentService.getDashboard();
      setDashboardData(res.stats);
    } catch (err) {
      setError(err.message || 'Failed to load student evaluation records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getSectionTitle = () => {
    switch (activeTab) {
      case 'overview':
      case 'dashboard':
        return 'Student Examination Dashboard';
      case 'tests':
        return 'Available Assigned Assessments';
      case 'upcoming':
        return 'Upcoming Scheduled Tests';
      case 'coding':
        return 'Coding Arena';
      case 'debugging':
        return 'Debugging Arena';
      case 'technical':
        return 'Technical Evaluation Quiz';
      case 'aptitude':
        return 'Aptitude & Logical Reasoning';
      case 'sql':
        return 'SQL & Database Arena';
      case 'results':
      case 'history':
        return 'Examination Results & Scorecards';
      case 'leaderboard':
        return 'Campus Leaderboard & Peer Standings';
      case 'analytics':
        return 'Student Performance Analytics';
      case 'notifications':
        return 'Announcements & Alerts';
      case 'profile':
        return 'Student Academic Profile';
      default:
        return 'Student Portal';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex transition-colors">
      {/* 13-Section Student Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} title="Student Examination Portal" />

        {/* Subheader */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-navy-800 bg-white/70 dark:bg-navy-900/60 backdrop-blur-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>{getSectionTitle()}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              CampusTest Evaluation Environment • Exclusively Assigned to {user?.name || 'You'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeTab !== 'tests' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTab('tests')}
                className="text-xs flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Available Tests</span>
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
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                  title="Assigned Tests"
                  value={dashboardData?.totalAssigned || 0}
                  icon={BookOpen}
                  description="Provisioned by instructors"
                  variant="primary"
                />
                <StatCard
                  title="Completed Tests"
                  value={dashboardData?.completedCount || 0}
                  icon={CheckCircle2}
                  description="Evaluated submissions"
                  variant="emerald"
                />
                <StatCard
                  title="Pass Rate"
                  value={`${dashboardData?.passedCount || 0} Passed`}
                  icon={TrendingUp}
                  description="Passing threshold met"
                  variant="indigo"
                />
                <StatCard
                  title="Average Score"
                  value={`${dashboardData?.averagePercentage || 0}%`}
                  icon={Award}
                  description="Cumulative accuracy"
                  variant="amber"
                />
                <StatCard
                  title="Upcoming Window"
                  value={dashboardData?.upcomingCount || 0}
                  icon={Calendar}
                  description="Pending evaluations"
                  variant="rose"
                />
              </div>

              {/* Specialized Arenas Launcher Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-electric-500" />
                      Specialized Evaluation Arenas
                    </h3>
                    <p className="text-xs text-slate-400">
                      Targeted skill assessments designed for campus placements and technical evaluations
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                  {/* 1. Coding Arena */}
                  <Card
                    onClick={() => setActiveTab('coding')}
                    className="border-slate-200 dark:border-navy-800 hover:border-electric-500 dark:hover:border-electric-500 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <CardBody className="p-4 space-y-2">
                      <div className="w-9 h-9 rounded-xl bg-electric-50 dark:bg-electric-950/70 text-electric-600 dark:text-electric-400 flex items-center justify-center font-bold">
                        <Code2 className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-electric-600 transition-colors">
                        Coding Arena
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        Data structures, algorithms, and array manipulations.
                      </p>
                    </CardBody>
                  </Card>

                  {/* 2. Debugging Arena */}
                  <Card
                    onClick={() => setActiveTab('debugging')}
                    className="border-slate-200 dark:border-navy-800 hover:border-rose-500 dark:hover:border-rose-500 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <CardBody className="p-4 space-y-2">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                        <Bug className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">
                        Debugging Arena
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        Isolate runtime crashes, async race conditions, and bug fixes.
                      </p>
                    </CardBody>
                  </Card>

                  {/* 3. Technical Quiz */}
                  <Card
                    onClick={() => setActiveTab('technical')}
                    className="border-slate-200 dark:border-navy-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <CardBody className="p-4 space-y-2">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                        <Cpu className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                        Technical Quiz
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        Core Computer Science, Operating Systems, Networks, and DSA.
                      </p>
                    </CardBody>
                  </Card>

                  {/* 4. Aptitude Test */}
                  <Card
                    onClick={() => setActiveTab('aptitude')}
                    className="border-slate-200 dark:border-navy-800 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <CardBody className="p-4 space-y-2">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                        <Brain className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                        Aptitude Test
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        Quantitative math, logical reasoning, and verbal comprehension.
                      </p>
                    </CardBody>
                  </Card>

                  {/* 5. SQL Test */}
                  <Card
                    onClick={() => setActiveTab('sql')}
                    className="border-slate-200 dark:border-navy-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <CardBody className="p-4 space-y-2">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                        <Database className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                        SQL Test
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        Database joins, aggregations, queries, and schema architecture.
                      </p>
                    </CardBody>
                  </Card>
                </div>
              </div>

              {/* Trajectory & Category Mastery */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="border-slate-200 dark:border-navy-800">
                    <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-navy-800 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-electric-500" />
                          Evaluation Performance Trajectory
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Chronological score trajectory across completed assessments
                        </p>
                      </div>
                      <Badge variant="primary">Verified Record</Badge>
                    </CardHeader>
                    <CardBody className="p-4 sm:p-5">
                      <StudentScoreTrajectory />
                    </CardBody>
                  </Card>
                </div>

                {/* Category Mastery */}
                <div className="space-y-6">
                  <Card className="border-slate-200 dark:border-navy-800">
                    <CardHeader className="p-4 border-b border-slate-100 dark:border-navy-800">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Arena Mastery Breakdown
                      </h4>
                    </CardHeader>
                    <CardBody className="p-4 space-y-3">
                      {(dashboardData?.categoryMastery || []).length === 0 ? (
                        <div className="py-6 text-center text-slate-400 text-xs">
                          Complete assessments to calculate category mastery.
                        </div>
                      ) : (
                        dashboardData.categoryMastery.map((cat, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {cat.category}
                              </span>
                              <span className="font-bold font-mono text-electric-600 dark:text-electric-400">
                                {cat.averagePercentage}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-navy-850 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-electric-500 rounded-full"
                                style={{ width: `${cat.averagePercentage}%` }}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </CardBody>
                  </Card>
                </div>
              </div>

              {/* Recent Results Table */}
              <Card className="border-slate-200 dark:border-navy-800 shadow-sm overflow-hidden">
                <CardHeader className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 dark:border-navy-800">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-slate-400" />
                      Recent Verified Results
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Latest completed assessments with pass/fail evaluation outcomes
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('results')}
                    className="text-xs"
                  >
                    <span>View All Results</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </CardHeader>

                <div className="overflow-x-auto">
                  {(!dashboardData?.recentSubmissions || dashboardData.recentSubmissions.length === 0) ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No completed tests yet. Start with Available Tests above.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-navy-850/60 text-slate-500 uppercase text-[10px] font-semibold">
                        <tr>
                          <th className="py-2.5 px-4">Assessment</th>
                          <th className="py-2.5 px-4">Score</th>
                          <th className="py-2.5 px-4">Accuracy</th>
                          <th className="py-2.5 px-4">Outcome</th>
                          <th className="py-2.5 px-4">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                        {dashboardData.recentSubmissions.map((sub, idx) => (
                          <tr key={sub.id || sub._id || idx} className="hover:bg-slate-50/60 dark:hover:bg-navy-850/40">
                            <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                              {sub.test?.title || sub.testTitle || 'Assessment'}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                              {sub.score ?? 0} / {sub.totalMarks ?? sub.total_marks ?? 100}
                            </td>
                            <td className="py-3 px-4 font-mono">{sub.percentage ?? 0}%</td>
                            <td className="py-3 px-4">
                              {sub.passed ? (
                                <Badge variant="success">Passed</Badge>
                              ) : (
                                <Badge variant="danger">Failed</Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-400 text-[11px]">
                              {new Date(sub.createdAt || sub.created_at).toLocaleDateString()}
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

          {/* 2. AVAILABLE TESTS */}
          {activeTab === 'tests' && (
            <AssignedTestsView
              title="Available Assessments"
              subtitle="All active examinations assigned to your student profile"
              icon={FileText}
            />
          )}

          {/* 3. UPCOMING TESTS */}
          {activeTab === 'upcoming' && (
            <AssignedTestsView
              isUpcomingOnly={true}
              title="Upcoming Examinations"
              subtitle="Scheduled tests with future examination windows and deadlines"
              icon={Calendar}
            />
          )}

          {/* 4. CODING ARENA */}
          {activeTab === 'coding' && (
            <AssignedTestsView
              category="coding"
              title="Coding Arena"
              subtitle="Algorithmic problem solving, data structures, and programming challenges"
              icon={Code2}
            />
          )}

          {/* 5. DEBUGGING ARENA */}
          {activeTab === 'debugging' && (
            <AssignedTestsView
              category="debugging"
              title="Debugging Arena"
              subtitle="Isolate runtime exceptions, memory leaks, and logical errors in live code"
              icon={Bug}
            />
          )}

          {/* 6. TECHNICAL QUIZ */}
          {activeTab === 'technical' && (
            <AssignedTestsView
              category="technical"
              title="Technical Quiz"
              subtitle="Core Computer Science, Operating Systems, Computer Networks, and DSA"
              icon={Cpu}
            />
          )}

          {/* 7. APTITUDE TEST */}
          {activeTab === 'aptitude' && (
            <AssignedTestsView
              category="aptitude"
              title="Aptitude & Reasoning Test"
              subtitle="Quantitative aptitude, logical deductions, and verbal comprehension"
              icon={Brain}
            />
          )}

          {/* 8. SQL TEST */}
          {activeTab === 'sql' && (
            <AssignedTestsView
              category="sql"
              title="SQL & Database Arena"
              subtitle="Relational schema architecture, complex joins, and query optimization"
              icon={Database}
            />
          )}

          {/* 9. RESULTS */}
          {(activeTab === 'results' || activeTab === 'history') && (
            <StudentResultsView onNavigateToTests={() => setActiveTab('tests')} />
          )}

          {/* 10. LEADERBOARD */}
          {activeTab === 'leaderboard' && <StudentLeaderboardView />}

          {/* 11. ANALYTICS */}
          {activeTab === 'analytics' && <StudentAnalyticsView />}

          {/* 12. NOTIFICATIONS */}
          {activeTab === 'notifications' && <StudentNotificationsView />}

          {/* 13. PROFILE */}
          {activeTab === 'profile' && <StudentProfileView />}
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
