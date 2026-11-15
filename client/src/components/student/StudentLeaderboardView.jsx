import React, { useState, useEffect } from 'react';
import Card, { CardBody, CardHeader } from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Loader from '../common/Loader';
import studentService from '../../services/studentService';
import {
  Trophy,
  Medal,
  Award,
  RotateCcw,
  Sparkles,
  User,
  Star,
  CheckCircle2,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

const StudentLeaderboardView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await studentService.getLeaderboard();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load leaderboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

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
        <div className="w-8 h-8 rounded-full bg-amber-900/10 text-amber-800 dark:text-amber-500 flex items-center justify-center font-bold text-xs">
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

  const myStanding = data?.myStanding;
  const rankings = data?.rankings || [];

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Your Standing Banner */}
      {myStanding && (
        <Card className="border-electric-200 dark:border-electric-900 bg-gradient-to-r from-electric-50/70 via-white to-slate-50 dark:from-navy-900 dark:via-navy-900/90 dark:to-navy-850 shadow-md">
          <CardBody className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-electric-600 text-white flex items-center justify-center font-mono font-bold text-xl shadow-lg shadow-electric-500/30 flex-shrink-0">
                #{myStanding.rank}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-electric-600 dark:text-electric-400">
                    Your Campus Standing
                  </span>
                  <Badge variant="primary">Verified Ranking</Badge>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {myStanding.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You have completed {myStanding.testsCompleted} evaluations with an average score of {myStanding.avgPercentage}%.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 font-mono text-center">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Rank Position</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">#{myStanding.rank}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Cumulative Score</span>
                <span className="text-xl font-bold text-electric-600 dark:text-electric-400">{myStanding.totalScore} Pts</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Average Accuracy</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{myStanding.avgPercentage}%</span>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Leaderboard Table */}
      <Card className="border-slate-200 dark:border-navy-800 shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 dark:border-navy-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Campus Honor Roll & Peer Standings ({rankings.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Standings computed dynamically across all verified examination submissions
            </p>
          </div>

          <Button variant="ghost" size="sm" onClick={fetchLeaderboard} className="text-xs">
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        </CardHeader>

        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader message="Calculating peer standings..." />
          </div>
        ) : rankings.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No student evaluations available to calculate leaderboard standings.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-850/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-16">Rank</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Tests Taken</th>
                  <th className="py-3 px-4">Cumulative Score</th>
                  <th className="py-3 px-4">Average Accuracy</th>
                  <th className="py-3 px-4">Pass Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-slate-700 dark:text-slate-300">
                {rankings.map((r) => (
                  <tr
                    key={r.studentId}
                    className={`transition-colors ${
                      r.isMe
                        ? 'bg-electric-50/80 dark:bg-electric-950/40 font-semibold'
                        : 'hover:bg-slate-50/70 dark:hover:bg-navy-850/40'
                    }`}
                  >
                    <td className="py-3.5 px-4">{getRankBadge(r.rank)}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {r.name}
                        </span>
                        {r.isMe && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-electric-600 text-white uppercase">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {r.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {r.testsCompleted} Assessment{r.testsCompleted > 1 ? 's' : ''}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {r.totalScore} Pts
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold font-mono">{r.avgPercentage}%</span>
                        <div className="w-14 h-1.5 bg-slate-100 dark:bg-navy-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-electric-500 rounded-full"
                            style={{ width: `${r.avgPercentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={r.passRate >= 70 ? 'success' : 'warning'}>
                        {r.passRate}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default StudentLeaderboardView;
