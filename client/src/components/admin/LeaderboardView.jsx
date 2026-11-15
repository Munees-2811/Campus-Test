import React, { useState, useEffect } from 'react';
import Card, { CardBody, CardHeader } from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Loader from '../common/Loader';
import adminService from '../../services/adminService';
import testService from '../../services/testService';
import {
  Trophy,
  Medal,
  Award,
  RotateCcw,
  Star,
  Flame,
  CheckCircle2,
  Clock,
  Filter
} from 'lucide-react';

const LeaderboardView = () => {
  const [rankings, setRankings] = useState([]);
  const [tests, setTests] = useState([]);
  const [testFilter, setTestFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError('');
      const [boardData, testData] = await Promise.all([
        adminService.getLeaderboard({ testId: testFilter }),
        testService.getTests()
      ]);
      setRankings(boardData.rankings || []);
      setTests(testData.tests || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch leaderboard standings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [testFilter]);

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shadow-xs">
          <Trophy className="w-4 h-4 text-amber-500" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-navy-750 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
          <Medal className="w-4 h-4 text-slate-400" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-900/10 text-amber-800 dark:text-amber-600 flex items-center justify-center font-bold text-xs">
          <Medal className="w-4 h-4 text-amber-700" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-navy-950 font-mono text-xs font-bold text-slate-500 flex items-center justify-center">
        #{rank}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <Card className="border-slate-200 dark:border-navy-800">
        <CardBody className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={testFilter}
              onChange={(e) => setTestFilter(e.target.value)}
              className="py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-950 text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">Overall Campus Standings (All Tests)</option>
              {tests.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title} ({t.category})
                </option>
              ))}
            </select>
          </div>

          <Button variant="ghost" size="sm" onClick={fetchLeaderboard} className="text-xs">
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Refresh Standings
          </Button>
        </CardBody>
      </Card>

      {/* Top 3 Podium Cards */}
      {rankings.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Silver #2 */}
          <Card className="border-slate-200 dark:border-navy-800 order-2 md:order-1 bg-slate-50/40 dark:bg-navy-900/40">
            <CardBody className="p-5 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-navy-800 text-slate-600 dark:text-slate-300 flex items-center justify-center mx-auto text-lg font-bold">
                🥈
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {rankings[1]?.name}
              </h4>
              <p className="text-[11px] text-slate-400 truncate">{rankings[1]?.email}</p>
              <div className="pt-2 flex justify-center gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-400">Score: </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{rankings[1]?.totalScore}</span>
                </div>
                <div>
                  <span className="text-slate-400">Avg: </span>
                  <span className="font-bold text-electric-600">{rankings[1]?.avgScorePercent}%</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Gold #1 */}
          <Card className="border-amber-300 dark:border-amber-700/60 order-1 md:order-2 bg-gradient-to-b from-amber-50/50 to-transparent dark:from-amber-950/20 shadow-md">
            <CardBody className="p-6 text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto text-2xl font-bold shadow-xs">
                👑
              </div>
              <Badge variant="warning" className="uppercase tracking-widest text-[10px]">
                Campus Champion
              </Badge>
              <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {rankings[0]?.name}
              </h4>
              <p className="text-xs text-slate-400 truncate">{rankings[0]?.email}</p>
              <div className="pt-2 flex justify-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-400">Total Pts: </span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">{rankings[0]?.totalScore}</span>
                </div>
                <div>
                  <span className="text-slate-400">Accuracy: </span>
                  <span className="font-bold text-emerald-600 text-sm">{rankings[0]?.avgScorePercent}%</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Bronze #3 */}
          <Card className="border-slate-200 dark:border-navy-800 order-3 bg-slate-50/40 dark:bg-navy-900/40">
            <CardBody className="p-5 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-800/10 text-amber-800 dark:text-amber-500 flex items-center justify-center mx-auto text-lg font-bold">
                🥉
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {rankings[2]?.name}
              </h4>
              <p className="text-[11px] text-slate-400 truncate">{rankings[2]?.email}</p>
              <div className="pt-2 flex justify-center gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-400">Score: </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{rankings[2]?.totalScore}</span>
                </div>
                <div>
                  <span className="text-slate-400">Avg: </span>
                  <span className="font-bold text-electric-600">{rankings[2]?.avgScorePercent}%</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Rankings Table */}
      <Card className="border-slate-200 dark:border-navy-800 shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 dark:border-navy-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Official Campus Honor Roll ({rankings.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Rankings computed dynamically from verified examination results in PostgreSQL
            </p>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader message="Calculating leaderboard standings..." />
            </div>
          ) : rankings.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
              No examination records found to compute standings.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-850/60 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-navy-800 uppercase font-semibold tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 w-16">Rank</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Tests Completed</th>
                  <th className="py-3 px-4">Total Score</th>
                  <th className="py-3 px-4">Average Score</th>
                  <th className="py-3 px-4">Pass Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-slate-700 dark:text-slate-300">
                {rankings.map((r) => (
                  <tr key={r.studentId} className="hover:bg-slate-50/70 dark:hover:bg-navy-850/40 transition-colors">
                    <td className="py-3.5 px-4">{getRankBadge(r.rank)}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {r.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {r.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {r.testsCompleted} Assessment{r.testsCompleted > 1 ? 's' : ''}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {r.totalScore} Pts
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold font-mono">{r.avgScorePercent}%</span>
                        <div className="w-16 h-1.5 bg-slate-100 dark:bg-navy-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-electric-500 rounded-full"
                            style={{ width: `${r.avgScorePercent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={r.passRate >= 70 ? 'success' : 'warning'}>
                        {r.passRate}% Passed
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};

export default LeaderboardView;
