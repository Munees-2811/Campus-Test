import React, { useState, useEffect } from 'react';
import Card, { CardBody, CardHeader } from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import Loader from '../common/Loader';
import adminService from '../../services/adminService';
import testService from '../../services/testService';
import {
  Calendar,
  Clock,
  RotateCcw,
  Edit,
  Power,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Timer
} from 'lucide-react';

const ScheduleManagementView = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Edit Schedule Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    startTime: '',
    endTime: '',
    autoActivate: true
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminService.getSchedules();
      setSchedules(res.schedules || []);
    } catch (err) {
      setError(err.message || 'Failed to load test schedules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const openScheduleModal = (sched) => {
    setSelectedSchedule(sched);
    setScheduleForm({
      startTime: sched.startTime ? sched.startTime.slice(0, 16) : '',
      endTime: sched.endTime ? sched.endTime.slice(0, 16) : '',
      autoActivate: sched.autoActivate
    });
    setIsEditModalOpen(true);
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await adminService.updateSchedule({
        testId: selectedSchedule.testId,
        startTime: scheduleForm.startTime ? new Date(scheduleForm.startTime).toISOString() : null,
        endTime: scheduleForm.endTime ? new Date(scheduleForm.endTime).toISOString() : null,
        autoActivate: scheduleForm.autoActivate
      });

      setIsEditModalOpen(false);
      showNotification(`Schedule for "${selectedSchedule.testTitle}" updated.`);
      fetchSchedules();
    } catch (err) {
      setError(err.message || 'Failed to update schedule.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (sched) => {
    try {
      await testService.updateTest(sched.testId, {
        isActive: !sched.isActive
      });
      showNotification(`Assessment ${!sched.isActive ? 'activated' : 'deactivated'}.`);
      fetchSchedules();
    } catch (err) {
      setError(err.message || 'Failed to update test status.');
    }
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

      <Card className="border-slate-200 dark:border-navy-800 shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 dark:border-navy-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-electric-500" />
              Examination Window Schedules ({schedules.length})
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Configure strict assessment start/end windows and automated activation
            </p>
          </div>

          <Button variant="ghost" size="sm" onClick={fetchSchedules} className="text-xs">
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        </CardHeader>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader message="Loading schedules..." />
            </div>
          ) : schedules.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
              No tests found to schedule. Create assessments first.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-850/60 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-navy-800 uppercase font-semibold tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Assessment</th>
                  <th className="py-3 px-4">Evaluation Window Start</th>
                  <th className="py-3 px-4">Evaluation Window End</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-slate-700 dark:text-slate-300">
                {schedules.map((sc) => (
                  <tr key={sc.id} className="hover:bg-slate-50/70 dark:hover:bg-navy-850/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {sc.testTitle}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {sc.category}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {sc.startTime ? new Date(sc.startTime).toLocaleString() : 'Immediate'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {sc.endTime ? new Date(sc.endTime).toLocaleString() : 'Always Open'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Timer className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sc.durationMinutes} Mins</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {sc.isActive ? (
                        <Badge variant="success">Active (Live)</Badge>
                      ) : (
                        <Badge variant="secondary">Suspended</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openScheduleModal(sc)}
                          title="Configure Schedule Window"
                          className="p-1.5 text-slate-400 hover:text-electric-600 dark:hover:text-electric-400 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(sc)}
                          title={sc.isActive ? 'Suspend Evaluation' : 'Activate Evaluation'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            sc.isActive
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                              : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Edit Schedule Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Configure Schedule: ${selectedSchedule?.testTitle}`}
      >
        <form onSubmit={handleSaveSchedule} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Start Window Date & Time
            </label>
            <input
              type="datetime-local"
              value={scheduleForm.startTime}
              onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              End Window Date & Time (Auto-close)
            </label>
            <input
              type="datetime-local"
              value={scheduleForm.endTime}
              onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-200"
            />
          </div>

          <label className="flex items-center gap-2 pt-2 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={scheduleForm.autoActivate}
              onChange={(e) => setScheduleForm({ ...scheduleForm, autoActivate: e.target.checked })}
              className="w-4 h-4 rounded text-electric-600 focus:ring-electric-500"
            />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Automatically activate test when start window commences
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={actionLoading}>
              Save Schedule Window
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ScheduleManagementView;
