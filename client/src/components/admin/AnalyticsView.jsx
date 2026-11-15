import React, { useState, useEffect } from 'react';
import Card, { CardBody, CardHeader } from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Loader from '../common/Loader';
import adminService from '../../services/adminService';
import {
  BarChart3,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  Users,
  Target,
  Trophy,
  Award
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

const AnalyticsView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminService.getAnalytics();
      setData(res.analytics);
    } catch (err) {
      setError(err.message || 'Failed to load performance analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#10b981'];

  return (
    <div className="space-y-6">
      {/* Header Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 dark:border-navy-800">
          <CardBody className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-electric-50 dark:bg-electric-950/70 text-electric-600 dark:text-electric-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Submissions Evaluated
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {data?.totalEvaluated || 0} Records
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-slate-200 dark:border-navy-800">
          <CardBody className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Student Cohort
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {data?.studentCount || 0} Enrolled
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-slate-200 dark:border-navy-800">
          <CardBody className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Analytics Engine
              </div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                Live PostgreSQL Telemetry
              </div>
            </div>
            <Button variant="ghost" size="xs" onClick={fetchAnalytics}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Sync
            </Button>
          </CardBody>
        </Card>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader message="Compiling analytics telemetry..." />
        </div>
      ) : (
        <>
          {/* Chart Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Distribution Chart */}
            <Card className="border-slate-200 dark:border-navy-800 shadow-sm">
              <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-navy-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-electric-500" />
                  Score Distribution (Histogram)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Percentage distribution of student grades across all tests
                </p>
              </CardHeader>
              <CardBody className="p-5">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data?.scoreDistribution || []}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#1e293b',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {(data?.scoreDistribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            {/* Test-wise Performance */}
            <Card className="border-slate-200 dark:border-navy-800 shadow-sm overflow-hidden flex flex-col">
              <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-navy-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-500" />
                  Assessment Pass Rates & Averages
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Performance metrics broken down by individual test
                </p>
              </CardHeader>
              <div className="overflow-x-auto flex-1 max-h-64">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-navy-850/60 text-slate-500 uppercase text-[10px] font-semibold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-4">Test Title</th>
                      <th className="py-2.5 px-4">Submissions</th>
                      <th className="py-2.5 px-4">Pass Rate</th>
                      <th className="py-2.5 px-4">Avg Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                    {(data?.testAnalytics || []).map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-navy-850/40">
                        <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {t.title}
                        </td>
                        <td className="py-2.5 px-4 font-mono">{t.submissions}</td>
                        <td className="py-2.5 px-4">
                          <Badge variant={t.passRate >= 70 ? 'success' : 'warning'}>
                            {t.passRate}%
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 font-mono font-medium">{t.averageScore} pts</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Top Performers Table */}
          <Card className="border-slate-200 dark:border-navy-800 shadow-sm overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-navy-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Top 10 Performers Honor Board
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Students demonstrating the highest cumulative score accuracy
              </p>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-navy-850/60 text-slate-500 uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="py-3 px-4 w-12">Rank</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Tests Evaluated</th>
                    <th className="py-3 px-4">Total Score</th>
                    <th className="py-3 px-4">Cumulative Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                  {(data?.topPerformers || []).map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-navy-850/40">
                      <td className="py-3 px-4 font-bold text-slate-500 font-mono">#{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{p.name}</div>
                        <div className="text-[11px] text-slate-400">{p.email}</div>
                      </td>
                      <td className="py-3 px-4 font-mono">{p.testsTaken} Tests</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {p.totalScore} / {p.totalMarks}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-electric-600 font-mono">
                            {p.avgPercentage}%
                          </span>
                          <div className="w-16 h-1.5 bg-slate-100 dark:bg-navy-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500"
                              style={{ width: `${p.avgPercentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default AnalyticsView;
