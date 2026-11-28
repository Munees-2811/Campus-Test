import React, { useState, useEffect, useRef } from 'react';
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
  GraduationCap,
  Edit3,
  Save,
  X,
  Camera,
  Trash2
} from 'lucide-react';

// Resize & compress uploaded image to max 256x256 JPEG data URL
const compressAvatarImage = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file.'));
      img.onload = () => {
        const maxSize = 256;
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

const StudentProfileView = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    department: '',
    batchYear: '',
    avatarUrl: ''
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await studentService.getProfile();
      setProfile(res.profile);
      setFormData({
        name: res.profile?.name || '',
        rollNumber: res.profile?.rollNumber || '',
        department: res.profile?.department || '',
        batchYear: res.profile?.batchYear || '',
        avatarUrl: res.profile?.avatarUrl || ''
      });
    } catch (err) {
      setError(err.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleStartEdit = () => {
    setError('');
    setSuccessMsg('');
    setFormData({
      name: profile?.name || '',
      rollNumber: profile?.rollNumber || '',
      department: profile?.department || '',
      batchYear: profile?.batchYear || '',
      avatarUrl: profile?.avatarUrl || ''
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError('');
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    try {
      setUploadingPhoto(true);
      setError('');
      const compressedDataUrl = await compressAvatarImage(file);

      if (isEditing) {
        setFormData((prev) => ({ ...prev, avatarUrl: compressedDataUrl }));
      } else {
        // Save immediately when uploaded from view mode
        const res = await studentService.updateProfile({
          name: profile?.name || 'Student',
          rollNumber: profile?.rollNumber || '',
          department: profile?.department || '',
          batchYear: profile?.batchYear || '',
          avatarUrl: compressedDataUrl
        });
        if (res.profile) {
          setProfile(res.profile);
          setFormData((prev) => ({ ...prev, avatarUrl: res.profile.avatarUrl || '' }));
        }
        setSuccessMsg('Profile picture updated successfully.');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload profile picture.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (isEditing) {
      setFormData((prev) => ({ ...prev, avatarUrl: '' }));
      return;
    }
    try {
      setUploadingPhoto(true);
      setError('');
      const res = await studentService.updateProfile({
        name: profile?.name || 'Student',
        rollNumber: profile?.rollNumber || '',
        department: profile?.department || '',
        batchYear: profile?.batchYear || '',
        avatarUrl: ''
      });
      if (res.profile) {
        setProfile(res.profile);
        setFormData((prev) => ({ ...prev, avatarUrl: '' }));
      }
      setSuccessMsg('Profile picture removed.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to remove profile picture.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Full name cannot be empty.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccessMsg('');
      const res = await studentService.updateProfile({
        name: formData.name.trim(),
        rollNumber: formData.rollNumber.trim(),
        department: formData.department.trim(),
        batchYear: formData.batchYear.trim(),
        avatarUrl: formData.avatarUrl || ''
      });

      if (res.profile) {
        setProfile(res.profile);
        // Sync updated name to stored user object if present
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            parsed.name = res.profile.name;
            localStorage.setItem('user', JSON.stringify(parsed));
          }
        } catch {
          // ignore localStorage sync errors
        }
      }

      setIsEditing(false);
      setSuccessMsg('Profile details updated successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <Loader message="Loading your student profile..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
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
          <form onSubmit={handleSaveProfile}>
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 mb-6">
              <div className="flex items-end gap-4">
                <div className="relative group flex-shrink-0">
                  <div className="w-24 h-24 rounded-2xl bg-white dark:bg-navy-900 p-1.5 shadow-lg shadow-black/10">
                    {(isEditing ? formData.avatarUrl : profile?.avatarUrl) ? (
                      <img
                        src={isEditing ? formData.avatarUrl : profile.avatarUrl}
                        alt={profile?.name || 'Student Avatar'}
                        className="w-full h-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-xl bg-electric-600 text-white flex items-center justify-center font-bold text-3xl">
                        {(isEditing ? formData.name : profile?.name) ? (isEditing ? formData.name : profile.name).charAt(0).toUpperCase() : 'S'}
                      </div>
                    )}
                  </div>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />

                  {/* Camera Upload Button */}
                  <button
                    type="button"
                    disabled={uploadingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload / Change profile picture"
                    className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-electric-600 hover:bg-electric-700 text-white shadow-md border-2 border-white dark:border-navy-900 flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>

                  {/* Remove Photo Button (if avatar exists) */}
                  {(isEditing ? formData.avatarUrl : profile?.avatarUrl) && (
                    <button
                      type="button"
                      disabled={uploadingPhoto}
                      onClick={handleRemovePhoto}
                      title="Remove profile picture"
                      className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md border-2 border-white dark:border-navy-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="space-y-1 mb-1">
                  {isEditing ? (
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Full Name"
                      className="px-3 py-1.5 text-base font-bold rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-electric-500"
                    />
                  ) : (
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {profile?.name}
                    </h2>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {profile?.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end flex-wrap">
                {isEditing ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={saving}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleStartEdit}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Profile</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsChangePasswordOpen(true)}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Change Password</span>
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Academic Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-navy-800 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-800 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Hash className="w-3.5 h-3.5" />
                  <span className="text-[11px] uppercase font-semibold">Roll Number / ID</span>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    placeholder="e.g. CS-2026-101"
                    className="w-full mt-1 px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-electric-500"
                  />
                ) : (
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {profile?.rollNumber}
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-800 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Building className="w-3.5 h-3.5" />
                  <span className="text-[11px] uppercase font-semibold">Department</span>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Computer Science & Engineering"
                    className="w-full mt-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-electric-500"
                  />
                ) : (
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {profile?.department}
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-800 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span className="text-[11px] uppercase font-semibold">Academic Batch</span>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.batchYear}
                    onChange={(e) => setFormData({ ...formData, batchYear: e.target.value })}
                    placeholder="e.g. 2022 - 2026"
                    className="w-full mt-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-electric-500"
                  />
                ) : (
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {profile?.batchYear}
                  </div>
                )}
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
          </form>
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
