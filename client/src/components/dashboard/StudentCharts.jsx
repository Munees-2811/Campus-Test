import React from 'react';
import Card, { CardBody, CardHeader } from '../common/Card';
import { useTheme } from '../../context/ThemeContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';

export const StudentScoreTrajectory = ({ submissions = [] }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const gridColor = isDark ? '#1e293b' : '#f1f5f9';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';

  const chartData = submissions
    .slice()
    .reverse()
    .map((sub, idx) => ({
      name: sub.test?.title?.slice(0, 14) || `Test ${idx + 1}`,
      percentage: Math.round((sub.score / (sub.totalMarks || 1)) * 100),
      score: sub.score,
      total: sub.totalMarks,
      passed: sub.passed
    }));

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Score Progression
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Your percentage evaluation trajectory across assessments
          </p>
        </div>
        <span className="text-[11px] font-semibold text-electric-600 dark:text-electric-400 bg-electric-50 dark:bg-electric-950/60 px-2 py-0.5 rounded-md">
          {submissions.length} Completed
        </span>
      </CardHeader>
      <CardBody className="pt-4 pb-2">
        <div className="h-64 w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
              <p className="text-xs font-medium">No assessment history yet.</p>
              <p className="text-[10px] mt-1 text-slate-400">Complete an assessment to start tracking your score curve.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="studentScoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" stroke={textColor} fontSize={11} tickLine={false} />
                <YAxis stroke={textColor} fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: isDark ? '#f8fafc' : '#0f172a',
                  }}
                  formatter={(val) => [`${val}%`, 'Score']}
                />
                <Area
                  type="monotone"
                  dataKey="percentage"
                  name="Score %"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#studentScoreGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default StudentScoreTrajectory;
