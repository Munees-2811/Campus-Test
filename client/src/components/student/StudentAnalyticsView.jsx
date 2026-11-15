import React, { useState, useEffect } from 'react';
import Card, { CardBody, CardHeader } from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Loader from '../common/Loader';
import studentService from '../../services/studentService';
import {
  BarChart3,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Target,
  Zap,
  Award,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line
} from 'recharts';

const StudentAnalyticsView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await studentService.getAnalytics();
      setData(res.analytics);
    } catch (err) {
      setError(err.message || 'Failed to load score analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 dark:border-navy-800">
          <CardBody className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-electric-50 dark:bg-electric-950/70 text-electric-600 dark:text-electric-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Evaluations Attempted
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {data?.totalEvaluations || 0} Tests
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-slate-200 dark:border-navy-800">
          <CardBody className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Pass Ratio
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {data?.passRatio || 0}% Success
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-slate-200 dark:border-navy-800">
          <CardBody className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Telemetry Engine
              </div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                Real-Time Postgres Analytics
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
          <Loader message="Synthesizing academic telemetry..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Mastery Chart */}
          <Card className="border-slate-200 dark:border-navy-800 shadow-sm">
            <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-navy-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-electric-500" />
                Arena Category Mastery (% Accuracy)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Average evaluation accuracy across specialized assessment arenas
              </p>
            </CardHeader>
            <CardBody className="p-5">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data?.categoryRadar || []}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val) => [`${val}%`, 'Accuracy']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#1e293b',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                      {(data?.categoryRadar || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          {/* Score Trajectory Timeline */}
          <Card className="border-slate-200 dark:border-navy-800 shadow-sm">
            <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-navy-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Examination Score Trajectory
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Chronological score progression over consecutive tests
              </p>
            </CardHeader>
            <CardBody className="p-5">
              {data?.timeline?.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                  No evaluation history to plot trajectory.
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={data?.timeline || []}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="testIndex" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#1e293b',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="percentage"
                        stroke="#2563eb"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#2563eb' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StudentAnalyticsView;
