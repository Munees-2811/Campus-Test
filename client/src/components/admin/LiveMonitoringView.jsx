import React, { useState, useEffect } from 'react';
import Card, { CardBody, CardHeader } from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Loader from '../common/Loader';
import adminService from '../../services/adminService';
import {
  Activity,
  Radio,
  Clock,
  RotateCcw,
  AlertTriangle,
  StopCircle,
  CheckCircle2,
  AlertCircle,
  User,
  FileText,
  ShieldAlert
} from 'lucide-react';

const LiveMonitoringView = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLiveSessions = async () => {
    try {
      setError('');
      const res = await adminService.getLiveMonitoring();
      setSessions(res.activeSessions || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch live monitoring feed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveSessions();
  }, []);

  // Auto-refresh interval (10 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLiveSessions();
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleForceSubmit = async (attemptId, studentName) => {
    const confirmed = window.confirm(
      `Are you sure you want to FORCE SUBMIT and terminate ${studentName}'s test session?`
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await adminService.forceSubmitAttempt(attemptId);
      showNotification(`Session for ${studentName} was forcibly terminated and submitted.`);
      fetchLiveSessions();
    } catch (err) {
      setError(err.message || 'Failed to force submit session.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Header Stat & Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 dark:border-navy-800">
          <CardBody className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-electric-50 dark:bg-electric-950/70 text-electric-600 dark:text-electric-400 flex items-center justify-center">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Live Test Takers
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {sessions.length} Students
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-slate-200 dark:border-navy-800">
          <CardBody className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Proctoring Feed
              </div>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Heartbeat Active
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-slate-200 dark:border-navy-800">
          <CardBody className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Polling Mode
              </div>
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                {autoRefresh ? 'Auto (10s)' : 'Manual'}
              </div>
            </div>
            <Button
              variant={autoRefresh ? 'primary' : 'outline'}
              size="xs"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'Pause Sync' : 'Resume Sync'}
            </Button>
          </CardBody>
        </Card>
      </div>

      {/* Live Sessions Table */}
      <Card className="border-slate-200 dark:border-navy-800 shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 dark:border-navy-800">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Live Test Sessions ({sessions.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time active examination sessions currently connected to backend
              </p>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={fetchLiveSessions} className="text-xs">
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Poll Now
          </Button>
        </CardHeader>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader message="Querying live test attempts..." />
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-navy-850 text-slate-400 flex items-center justify-center mx-auto">
                <Radio className="w-6 h-6 text-slate-400" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No Active Sessions
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                There are currently no students taking an assessment right now. When a student starts an exam, their live progress will stream here.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-850/60 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-navy-800 uppercase font-semibold tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Assessment</th>
                  <th className="py-3 px-4">Elapsed Time</th>
                  <th className="py-3 px-4">Remaining Window</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-slate-700 dark:text-slate-300">
                {sessions.map((s) => (
                  <tr key={s.attemptId} className="hover:bg-slate-50/70 dark:hover:bg-navy-850/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {s.student.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {s.student.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {s.test.title}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Total {s.test.durationMinutes} Minutes
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                      {formatSeconds(s.elapsedSeconds)}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {s.status === 'overdue' ? (
                        <Badge variant="danger">Time Expired</Badge>
                      ) : (
                        <span className="text-electric-600 dark:text-electric-400 font-bold">
                          {formatSeconds(s.remainingSeconds)}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 w-44">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                          <span>Progress</span>
                          <span>{s.progressPercent}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-navy-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              s.progressPercent > 85 ? 'bg-amber-500' : 'bg-electric-500'
                            }`}
                            style={{ width: `${s.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="danger"
                        size="xs"
                        onClick={() => handleForceSubmit(s.attemptId, s.student.name)}
                        className="text-xs flex items-center gap-1 ml-auto"
                      >
                        <StopCircle className="w-3.5 h-3.5" />
                        <span>Force Submit</span>
                      </Button>
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

export default LiveMonitoringView;
