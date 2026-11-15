import React, { useState, useEffect, useMemo } from 'react';
import Card, { CardBody, CardHeader } from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import Loader from '../common/Loader';
import adminService from '../../services/adminService';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Edit2,
  Trash2,
  Power,
  KeyRound,
  RotateCcw,
  Copy,
  Check,
  Upload,
  AlertCircle,
  CheckCircle2,
  Mail,
  User,
  Hash,
  Building
} from 'lucide-react';

const StudentManagementView = ({ onNavigateToBulkImport }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, active, inactive

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTempCredsModalOpen, setIsTempCredsModalOpen] = useState(false);
  const [isResetPwdModalOpen, setIsResetPwdModalOpen] = useState(false);

  // Active student for edit / actions
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [tempCreds, setTempCreds] = useState(null);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    rollNumber: '',
    department: 'Computer Science',
    password: ''
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    rollNumber: '',
    department: ''
  });

  const [resetPwdForm, setResetPwdForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminService.getStudents();
      setStudents(res.students || []);
    } catch (err) {
      setError(err.message || 'Failed to load students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase()) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(search.toLowerCase()));

      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'active' && s.isActive) ||
        (statusFilter === 'inactive' && !s.isActive);

      return matchSearch && matchStatus;
    });
  }, [students, search, statusFilter]);

  // Handle Add Student
  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.email.trim()) {
      setError('Name and email are required.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await adminService.createStudent(addForm);
      setIsAddModalOpen(false);
      setAddForm({ name: '', email: '', rollNumber: '', department: 'Computer Science', password: '' });
      showNotification(`Student ${res.student?.name || 'account'} enrolled successfully!`);
      fetchStudents();
    } catch (err) {
      setError(err.message || 'Failed to add student.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Edit Student
  const openEditModal = (student) => {
    setSelectedStudent(student);
    setEditForm({
      name: student.name,
      email: student.email,
      rollNumber: student.rollNumber || '',
      department: student.department || 'General'
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await adminService.updateStudent(selectedStudent.id, editForm);
      setIsEditModalOpen(false);
      showNotification('Student profile updated successfully.');
      fetchStudents();
    } catch (err) {
      setError(err.message || 'Failed to update student.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Deactivate / Activate
  const handleToggleStatus = async (student) => {
    const nextStatus = !student.isActive;
    const confirmAction = window.confirm(
      `Are you sure you want to ${nextStatus ? 'activate' : 'deactivate'} ${student.name}?`
    );
    if (!confirmAction) return;

    try {
      await adminService.toggleStudentStatus(student.id, nextStatus);
      showNotification(`Student account ${nextStatus ? 'activated' : 'deactivated'}.`);
      fetchStudents();
    } catch (err) {
      setError(err.message || 'Failed to update student status.');
    }
  };

  // Handle Generate Temp Credentials
  const handleGenerateTempCreds = async (student) => {
    try {
      setActionLoading(true);
      const res = await adminService.generateTempCredentials(student.id);
      setTempCreds(res.credentials);
      setIsTempCredsModalOpen(true);
      setCopied(false);
      fetchStudents();
    } catch (err) {
      setError(err.message || 'Failed to generate temporary credentials.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reset Password
  const openResetPwdModal = (student) => {
    setSelectedStudent(student);
    setResetPwdForm({ newPassword: '', confirmPassword: '' });
    setIsResetPwdModalOpen(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (resetPwdForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (resetPwdForm.newPassword !== resetPwdForm.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setActionLoading(true);
      await adminService.resetStudentPassword(selectedStudent.id, resetPwdForm.newPassword);
      setIsResetPwdModalOpen(false);
      showNotification(`Password for ${selectedStudent.name} was successfully updated.`);
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setActionLoading(false);
    }
  };

  const copyCredsToClipboard = () => {
    if (!tempCreds) return;
    const text = `CampusTest Student Credentials:\nEmail: ${tempCreds.email}\nTemporary Password: ${tempCreds.temporaryPassword}\nLogin Portal: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2.5 animate-fadeIn">
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

      {/* Header Actions & Search Bar */}
      <Card className="border-slate-200 dark:border-navy-800">
        <CardBody className="p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-1 w-full flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search students by name, email, roll #..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-electric-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-electric-500"
              >
                <option value="ALL">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Deactivated Only</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToBulkImport}
              className="text-xs flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>CSV Bulk Import</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Student</span>
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Students Data Table */}
      <Card className="border-slate-200 dark:border-navy-800 shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 dark:border-navy-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-electric-500" />
              Enrolled Students Directory ({filteredStudents.length})
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Manage accounts, reset credentials, and monitor active statuses
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchStudents} className="text-xs">
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        </CardHeader>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader message="Loading student records..." />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
              No students found matching your criteria.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-850/60 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-navy-800 uppercase font-semibold tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Roll # / Dept</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Enrolled Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-slate-700 dark:text-slate-300">
                {filteredStudents.map((st) => (
                  <tr
                    key={st.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-navy-850/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-navy-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-xs">
                          {st.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {st.name}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500">
                            {st.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {st.rollNumber || 'N/A'}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">
                        {st.department}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {st.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="danger">Deactivated</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 dark:text-slate-500 text-[11px]">
                      {new Date(st.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleGenerateTempCreds(st)}
                          title="Generate Secure Temp Credentials"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-electric-600 dark:text-slate-400 dark:hover:text-electric-400 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openResetPwdModal(st)}
                          title="Reset Password"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(st)}
                          title="Edit Student"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(st)}
                          title={st.isActive ? 'Deactivate Student' : 'Activate Student'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            st.isActive
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

      {/* 1. Add Student Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Enroll New Student"
      >
        <form onSubmit={handleAddStudent} className="space-y-4">
          <Input
            label="Full Name"
            name="name"
            required
            placeholder="e.g. Alex Morgan"
            icon={User}
            value={addForm.name}
            onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
          />
          <Input
            label="Campus Email"
            name="email"
            type="email"
            required
            placeholder="alex@campus.edu"
            icon={Mail}
            value={addForm.email}
            onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Roll Number / ID"
              name="rollNumber"
              placeholder="CS-2026-042"
              icon={Hash}
              value={addForm.rollNumber}
              onChange={(e) => setAddForm({ ...addForm, rollNumber: e.target.value })}
            />
            <Input
              label="Department"
              name="department"
              placeholder="Computer Science"
              icon={Building}
              value={addForm.department}
              onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
            />
          </div>
          <Input
            label="Initial Password (Optional)"
            name="password"
            type="password"
            placeholder="Leave blank to auto-generate"
            value={addForm.password}
            onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
          />
          <p className="text-[11px] text-slate-400">
            If left blank, a secure temporary password will be auto-generated and emailed/notified.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={actionLoading}>
              Enroll Student
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Edit Student Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Student Information"
      >
        <form onSubmit={handleUpdateStudent} className="space-y-4">
          <Input
            label="Full Name"
            required
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
          <Input
            label="Campus Email"
            type="email"
            required
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Roll Number"
              value={editForm.rollNumber}
              onChange={(e) => setEditForm({ ...editForm, rollNumber: e.target.value })}
            />
            <Input
              label="Department"
              value={editForm.department}
              onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={actionLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. Temp Credentials Modal */}
      <Modal
        isOpen={isTempCredsModalOpen}
        onClose={() => setIsTempCredsModalOpen(false)}
        title="Secure Temporary Credentials"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            A secure one-time temporary password has been set for this student. Please share these credentials directly with the student:
          </p>
          {tempCreds && (
            <div className="p-4 bg-slate-50 dark:bg-navy-950 rounded-xl border border-slate-200 dark:border-navy-750 font-mono space-y-2">
              <div>
                <span className="text-slate-400">Student: </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{tempCreds.studentName}</span>
              </div>
              <div>
                <span className="text-slate-400">Email: </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{tempCreds.email}</span>
              </div>
              <div>
                <span className="text-slate-400">Temp Password: </span>
                <span className="font-bold text-electric-600 dark:text-electric-400 bg-electric-50 dark:bg-electric-950/70 px-2 py-0.5 rounded">
                  {tempCreds.temporaryPassword}
                </span>
              </div>
            </div>
          )}
          <div className="flex justify-between items-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyCredsToClipboard}
              className="flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsTempCredsModalOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* 4. Reset Password Modal */}
      <Modal
        isOpen={isResetPwdModalOpen}
        onClose={() => setIsResetPwdModalOpen(false)}
        title={`Reset Password: ${selectedStudent?.name}`}
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            required
            placeholder="••••••••"
            value={resetPwdForm.newPassword}
            onChange={(e) => setResetPwdForm({ ...resetPwdForm, newPassword: e.target.value })}
          />
          <Input
            label="Confirm New Password"
            type="password"
            required
            placeholder="••••••••"
            value={resetPwdForm.confirmPassword}
            onChange={(e) => setResetPwdForm({ ...resetPwdForm, confirmPassword: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsResetPwdModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={actionLoading}>
              Set New Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudentManagementView;
