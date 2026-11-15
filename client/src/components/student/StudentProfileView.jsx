import React, { useState, useEffect } from 'react';
import Card, { CardBody, CardHeader } from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Loader from '../common/Loader';
import ChangePasswordModal from '../common/ChangePasswordModal';
import studentService from '../../services/studentService';
import {
  User,
  Mail,
  Hash,
  Building,
  Calendar,
  ShieldCheck,
  KeyRound,
  Award,
  CheckCircle2,
  AlertCircle,
  GraduationCap
} from 'lucide-react';

const StudentProfileView = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await studentService.getProfile();
      setProfile(res.profile);
    } catch (err) {
      setError(err.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <Loader message="Loading your student profile..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Main Identity Card */}
      <Card className="border-slate-200 dark:border-navy-800 shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-navy-900 via-electric-900 to-electric-800 relative">
          <div className="absolute top-4 right-4">
            <Badge variant="primary" className="bg-white/20 text-white backdrop-blur-xs border-white/20">
              Enrolled Student
            </Badge>
          </div>
        </div>

        <CardBody className="p-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 mb-6">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-2xl bg-white dark:bg-navy-900 p-1.5 shadow-lg shadow-black/10 flex-shrink-0">
                <div className="w-full h-full rounded-xl bg-electric-600 text-white flex items-center justify-center font-bold text-3xl">
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : 'S'}
                </div>
              </div>

              <div className="space-y-1 mb-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {profile?.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {profile?.email}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsChangePasswordOpen(true)}
              className="text-xs flex items-center gap-1.5 self-end"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Change Password</span>
            </Button>
          </div>

          {/* Academic Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-navy-800 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Hash className="w-3.5 h-3.5" />
                <span className="text-[11px] uppercase font-semibold">Roll Number / ID</span>
              </div>
              <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {profile?.rollNumber}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Building className="w-3.5 h-3.5" />
                <span className="text-[11px] uppercase font-semibold">Department</span>
              </div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                {profile?.department}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400">
                <GraduationCap className="w-3.5 h-3.5" />
                <span className="text-[11px] uppercase font-semibold">Academic Batch</span>
              </div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                {profile?.batchYear}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[11px] uppercase font-semibold">Account Status</span>
              </div>
              <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{profile?.accountStatus}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] uppercase font-semibold">Evaluations Completed</span>
              </div>
              <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {profile?.completedAssessments} Tests
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-[11px] uppercase font-semibold">Enrolled On</span>
              </div>
              <div className="font-mono text-slate-700 dark:text-slate-300">
                {profile?.enrolledAt ? new Date(profile.enrolledAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
};

export default StudentProfileView;
