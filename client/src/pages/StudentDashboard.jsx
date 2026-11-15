import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Card, { CardBody, CardHeader } from '../components/common/Card';
import StatCard from '../components/common/StatCard';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Loader from '../components/common/Loader';
import { StudentScoreTrajectory } from '../components/dashboard/StudentCharts';
import testService from '../services/testService';
import {
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  FileCheck2,
  Check,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

const StudentDashboard = () => {
  const [stats, setStats] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sidebar & Layout State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();

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
      setError(err.message || 'Failed to load student dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      const query = searchQuery.toLowerCase();
      return (
        t.title?.toLowerCase().includes(query) ||
        t.category?.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    });
  }, [tests, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex items-center justify-center">
        <Loader fullScreen message="Loading Student Examination Portal..." />
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

      {/* Main Content */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Header
          onOpenSidebar={() => setSidebarOpen(true)}
          title="Student Examination Portal"
          subtitle="Explore published college assessments, attempt evaluations, and track scores"
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

          {/* Welcome Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Academic Progress Overview
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Track your active evaluations and recent submission scorecards
              </p>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Available Assessments"
              value={stats?.availableTests || 0}
              subtitle="Open tests ready to take"
              icon={BookOpen}
              accentColor="electric"
              badgeText="Active"
            />
            <StatCard
              title="Assessments Completed"
              value={stats?.testsTaken || 0}
              subtitle="Recorded student evaluations"
              icon={Clock}
              accentColor="navy"
              badgeText="Taken"
            />
            <StatCard
              title="Assessments Passed"
              value={stats?.testsPassed || 0}
              subtitle="Achieved passing score ≥40%"
              icon={CheckCircle2}
              accentColor="emerald"
              badgeText="Passed"
            />
            <StatCard
              title="Cumulative Average"
              value={`${stats?.averagePercentage || 0}%`}
              subtitle="Overall grade percentage"
              icon={TrendingUp}
              accentColor="amber"
              badgeText="Score"
            />
          </div>

          {/* Score Trajectory Chart */}
          {stats?.recentSubmissions?.length > 0 && (
            <div className="space-y-2">
              <StudentScoreTrajectory submissions={stats.recentSubmissions} />
            </div>
          )}

          {/* Available Tests Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Available Assessments
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {filteredTests.length} test{filteredTests.length !== 1 ? 's' : ''} available to attempt
                </p>
              </div>
            </div>

            {filteredTests.length === 0 ? (
              <Card className="p-10 text-center text-slate-400 dark:text-slate-500 space-y-2">
                <BookOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-navy-700" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No active assessments available
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Your campus instructors will publish assessments here. Check back soon.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTests.map((test) => {
                  const sub = test.previousResult || test.submission || null;
                  const isCompleted = test.alreadySubmitted || !!sub;

                  return (
                    <Card
                      key={test._id}
                      hover
                      className="flex flex-col justify-between border-slate-200/90 dark:border-navy-800"
                    >
                      <CardBody className="space-y-3.5 p-5">
                        <div className="flex items-start justify-between gap-2">
                          <Badge variant="primary" size="sm">
                            {test.category}
                          </Badge>
                          {isCompleted && sub && (
                            <Badge variant={sub.passed ? 'success' : 'danger'} size="sm" dot>
                              {sub.passed ? 'PASSED' : 'FAILED'}
                            </Badge>
                          )}
                        </div>

                        <div>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                            {test.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {test.description || 'Comprehensive campus evaluation.'}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {test.durationMinutes} mins
                          </span>
                          <span>{test.questions?.length || 0} Questions</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {test.totalMarks} pts
                          </span>
                        </div>
                      </CardBody>

                      <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-navy-850/60 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between">
                        {isCompleted ? (
                          <div className="w-full flex items-center justify-between text-xs">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">
                              Recorded Score:
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {sub?.score ?? '—'} / {sub?.totalMarks ?? test.totalMarks}
                            </span>
                          </div>
                        ) : (
                          <Button
                            variant="primary"
                            className="w-full justify-between"
                            onClick={() => navigate(`/student/test/${test._id}`)}
                          >
                            <span>Start Assessment</span>
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past Submissions History Table */}
          {stats?.recentSubmissions?.length > 0 && (
            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Completed Assessment Records
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Your official evaluation scores and timestamps
                  </p>
                </div>
              </div>

              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-navy-800 bg-slate-50/70 dark:bg-navy-850/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <th className="px-5 py-3">Assessment</th>
                        <th className="px-5 py-3">Domain</th>
                        <th className="px-5 py-3">Submitted On</th>
                        <th className="px-5 py-3 text-right">Points</th>
                        <th className="px-5 py-3 text-right">Percentage</th>
                        <th className="px-5 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-xs">
                      {stats.recentSubmissions.map((sub) => {
                        const percent = Math.round((sub.score / (sub.totalMarks || 1)) * 100);
                        return (
                          <tr
                            key={sub._id}
                            className="hover:bg-slate-50/70 dark:hover:bg-navy-850/50 transition-colors"
                          >
                            <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                              {sub.test?.title || 'Assessment'}
                            </td>
                            <td className="px-5 py-3.5">
                              <Badge variant="primary" size="sm">
                                {sub.test?.category || 'General'}
                              </Badge>
                            </td>
                            <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                              {new Date(sub.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-5 py-3.5 text-right font-bold text-slate-800 dark:text-slate-200">
                              {sub.score} / {sub.totalMarks}
                            </td>
                            <td className="px-5 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-300">
                              {percent}%
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <Badge variant={sub.passed ? 'success' : 'danger'} size="sm" dot>
                                {sub.passed ? 'PASSED' : 'FAILED'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
