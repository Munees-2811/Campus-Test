import React from 'react';
import Card, { CardBody, CardHeader } from '../common/Card';
import { useTheme } from '../../context/ThemeContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';

export const AdminPerformanceChart = ({ tests = [], recentResults = [] }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Build chart data from recent results or test categories
  const categoryData = tests.reduce((acc, t) => {
    const existing = acc.find((item) => item.name === t.category);
    if (existing) {
      existing.count += 1;
      existing.totalMarks += t.totalMarks || 0;
    } else {
      acc.push({
        name: t.category,
        count: 1,
        totalMarks: t.totalMarks || 0,
      });
    }
    return acc;
  }, []);

  const chartData = categoryData.length > 0
    ? categoryData
    : [
        { name: 'Technical', count: 1, totalMarks: 4 },
        { name: 'Aptitude', count: 1, totalMarks: 2 },
      ];

  // Score distribution from submissions
  const scoreData = (recentResults || []).map((r, i) => ({
    name: r.student?.name?.split(' ')[0] || `Student ${i + 1}`,
    score: r.score,
    total: r.totalMarks,
    passed: r.passed ? 'Passed' : 'Failed'
  }));

  const gridColor = isDark ? '#1e293b' : '#f1f5f9';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Assessments by Category */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Assessment Categories
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Distribution of published tests by subject domain
            </p>
          </div>
          <span className="text-[11px] font-semibold text-electric-600 dark:text-electric-400 bg-electric-50 dark:bg-electric-950/60 px-2 py-0.5 rounded-md">
            Active
          </span>
        </CardHeader>
        <CardBody className="pt-4 pb-2">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" stroke={textColor} fontSize={11} tickLine={false} />
                <YAxis stroke={textColor} fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Bar dataKey="count" name="Published Tests" fill="#2563eb" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#2563eb' : '#0ea5e9'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>

      {/* Submission Score Distribution */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Performance Trend
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Individual student scores across recent attempts
            </p>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
            Scores
          </span>
        </CardHeader>
        <CardBody className="pt-4 pb-2">
          <div className="h-64 w-full">
            {scoreData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
                <p className="text-xs">No student submission scores recorded yet.</p>
                <p className="text-[10px] mt-1 text-slate-400">Scores will display here as assessments are submitted.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="name" stroke={textColor} fontSize={11} tickLine={false} />
                  <YAxis stroke={textColor} fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: isDark ? '#f8fafc' : '#0f172a',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    name="Score Achieved"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#scoreGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default AdminPerformanceChart;
