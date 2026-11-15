import React, { useState, useEffect } from 'react';
import Card, { CardBody, CardHeader } from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import Loader from '../common/Loader';
import adminService from '../../services/adminService';
import {
  Bell,
  Send,
  Trash2,
  RotateCcw,
  Plus,
  Users,
  User,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  Radio
} from 'lucide-react';

const NotificationsView = () => {
  const [notifications, setNotifications] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    target: 'all', // 'all' or 'student'
    studentId: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [notifData, studData] = await Promise.all([
        adminService.getNotifications(),
        adminService.getStudents()
      ]);
      setNotifications(notifData.notifications || []);
      setStudents(studData.students || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) {
      setError('Title and message are required.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await adminService.broadcastNotification(broadcastForm);
      setIsBroadcastModalOpen(false);
      setBroadcastForm({ title: '', message: '', target: 'all', studentId: '' });
      showNotification(res.message || 'Announcement broadcasted successfully!');
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to send broadcast.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteNotif = async (id) => {
    try {
      await adminService.deleteNotification(id);
      showNotification('Notification deleted.');
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to delete notification.');
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

      {/* Header Card */}
      <Card className="border-slate-200 dark:border-navy-800 shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 dark:border-navy-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-electric-500" />
              Campus Broadcasts & Announcements ({notifications.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Deliver institutional examination alerts, password reminders, and system announcements
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchData} className="text-xs">
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsBroadcastModalOpen(true)}
              className="text-xs flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Announcement</span>
            </Button>
          </div>
        </CardHeader>

        <div className="divide-y divide-slate-100 dark:divide-navy-800">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader message="Loading notification feed..." />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No recent announcements or notifications found.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="p-4 sm:p-5 hover:bg-slate-50/70 dark:hover:bg-navy-850/40 transition-colors flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-electric-50 dark:bg-electric-950/70 text-electric-600 dark:text-electric-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {n.title}
                      </h4>
                      <Badge variant="outline">
                        {n.recipient?.name ? `To: ${n.recipient.name}` : 'Broadcast: All Students'}
                      </Badge>
                      <span className="text-[10px] text-slate-400">
                        {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteNotif(n.id)}
                  title="Delete notification"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Broadcast Modal */}
      <Modal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        title="Send Announcement / Notification"
      >
        <form onSubmit={handleSendBroadcast} className="space-y-4">
          <Input
            label="Announcement Title *"
            required
            placeholder="e.g. Midterm Evaluation Schedule Update"
            value={broadcastForm.title}
            onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Recipient Target
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                  broadcastForm.target === 'all'
                    ? 'border-electric-500 bg-electric-50/50 dark:bg-electric-950/30 text-electric-700 dark:text-electric-300 font-semibold'
                    : 'border-slate-200 dark:border-navy-750 text-slate-600 dark:text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="target"
                  value="all"
                  checked={broadcastForm.target === 'all'}
                  onChange={() => setBroadcastForm({ ...broadcastForm, target: 'all', studentId: '' })}
                  className="hidden"
                />
                <Users className="w-4 h-4" />
                <span>All Enrolled Students</span>
              </label>

              <label
                className={`p-3 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                  broadcastForm.target === 'student'
                    ? 'border-electric-500 bg-electric-50/50 dark:bg-electric-950/30 text-electric-700 dark:text-electric-300 font-semibold'
                    : 'border-slate-200 dark:border-navy-750 text-slate-600 dark:text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="target"
                  value="student"
                  checked={broadcastForm.target === 'student'}
                  onChange={() => setBroadcastForm({ ...broadcastForm, target: 'student' })}
                  className="hidden"
                />
                <User className="w-4 h-4" />
                <span>Individual Student</span>
              </label>
            </div>
          </div>

          {broadcastForm.target === 'student' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Choose Student *
              </label>
              <select
                required
                value={broadcastForm.studentId}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, studentId: e.target.value })}
                className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-200"
              >
                <option value="">-- Select Student --</option>
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Message Statement *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Type your official announcement statement..."
              value={broadcastForm.message}
              onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
              className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-electric-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsBroadcastModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={actionLoading}>
              Dispatch Notification
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default NotificationsView;
