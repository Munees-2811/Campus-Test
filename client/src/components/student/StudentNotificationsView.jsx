import React, { useState, useEffect } from 'react';
import Card, { CardBody, CardHeader } from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Loader from '../common/Loader';
import studentService from '../../services/studentService';
import {
  Bell,
  CheckCheck,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles
} from 'lucide-react';

const StudentNotificationsView = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await studentService.getNotifications();
      setNotifications(res.notifications || []);
    } catch (err) {
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await studentService.markNotificationRead(id);
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setActionLoading(true);
      await studentService.markAllNotificationsRead();
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6 max-w-4xl">
      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <Card className="border-slate-200 dark:border-navy-800 shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 dark:border-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-electric-50 dark:bg-electric-950/70 text-electric-600 dark:text-electric-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Announcements & Alerts</span>
                {unreadCount > 0 && (
                  <Badge variant="primary" className="text-[10px] font-mono">
                    {unreadCount} Unread
                  </Badge>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Official institutional communications, test schedules, and evaluation reminders
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="xs"
                onClick={handleMarkAllRead}
                isLoading={actionLoading}
                className="text-xs"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" /> Mark All Read
              </Button>
            )}
            <Button variant="ghost" size="xs" onClick={fetchNotifications}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
          </div>
        </CardHeader>

        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader message="Querying your notification alerts..." />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-navy-850 text-slate-400 flex items-center justify-center mx-auto">
              <Bell className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No Notifications Right Now
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You are all caught up! When an instructor schedules an assessment or broadcasts an alert, it will show up here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-navy-800">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 sm:p-5 transition-colors flex items-start justify-between gap-4 ${
                  !n.is_read
                    ? 'bg-electric-50/50 dark:bg-electric-950/20'
                    : 'hover:bg-slate-50/60 dark:hover:bg-navy-850/40'
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      !n.is_read ? 'bg-electric-600 animate-pulse' : 'bg-transparent'
                    }`}
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        {new Date(n.created_at).toLocaleDateString()} at{' '}
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                </div>

                {!n.is_read && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleMarkAsRead(n.id)}
                    className="text-[11px] text-electric-600 hover:text-electric-700"
                  >
                    Mark Read
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default StudentNotificationsView;
