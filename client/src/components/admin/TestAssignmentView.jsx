import React, { useState, useEffect } from 'react';
import Card, { CardBody, CardHeader } from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import Loader from '../common/Loader';
import adminService from '../../services/adminService';
import testService from '../../services/testService';
import {
  Send,
  UserCheck,
  Calendar,
  Clock,
  Trash2,
  RotateCcw,
  Plus,
  CheckCircle2,
  AlertCircle,
  Users,
  FileText
} from 'lucide-react';

const TestAssignmentView = () => {
  const [assignments, setAssignments] = useState([]);
  const [tests, setTests] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [selectedTestId, setSelectedTestId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [dueDate, setDueDate] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [assignRes, testRes, studRes] = await Promise.all([
        adminService.getAssignments(),
        testService.getTests(),
        adminService.getStudents()
      ]);
      setAssignments(assignRes.assignments || []);
      setTests(testRes.tests || []);
      setStudents(studRes.students || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch assignments.');
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

  const handleToggleStudent = (studentId) => {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds(selectedStudentIds.filter((id) => id !== studentId));
    } else {
      setSelectedStudentIds([...selectedStudentIds, studentId]);
    }
  };

  const handleSelectAllStudents = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map((s) => s.id));
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!selectedTestId) {
      setError('Please select an assessment.');
      return;
    }
    if (selectedStudentIds.length === 0) {
      setError('Please select at least one student.');
      return;
    }

    try {
      setActionLoading(true);
      await adminService.createAssignment({
        testId: selectedTestId,
        studentIds: selectedStudentIds,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null
      });

      setIsAssignModalOpen(false);
      setSelectedTestId('');
      setSelectedStudentIds([]);
      setDueDate('');
      showNotification('Assessment assigned to selected students successfully!');
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to assign test.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this student assignment?')) return;
    try {
      await adminService.deleteAssignment(id);
      showNotification('Assignment revoked.');
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to revoke assignment.');
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
              <UserCheck className="w-4 h-4 text-electric-500" />
              Active Test Assignments ({assignments.length})
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Assign mandatory or cohort-specific assessments with deadline tracking
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchData} className="text-xs">
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAssignModalOpen(true)}
              className="text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign Assessment</span>
            </Button>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader message="Loading assignments..." />
            </div>
          ) : assignments.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
              No active test assignments currently found. Click "Assign Assessment" to assign tests to students.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-850/60 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-navy-800 uppercase font-semibold tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Assessment Title</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned On</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-slate-700 dark:text-slate-300">
                {assignments.map((a) => (
                  <tr key={a._id} className="hover:bg-slate-50/70 dark:hover:bg-navy-850/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {a.student?.name || 'Student'}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">
                        {a.student?.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {a.test?.title || 'Assessment'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {a.test?.category} • {a.test?.durationMinutes} Mins
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {a.dueDate ? new Date(a.dueDate).toLocaleString() : 'No Deadline'}
                    </td>
                    <td className="py-3.5 px-4">
                      {a.status === 'completed' ? (
                        <Badge variant="success">Completed</Badge>
                      ) : a.status === 'in_progress' ? (
                        <Badge variant="primary">In Progress</Badge>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteAssignment(a._id)}
                        title="Revoke Assignment"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Assign Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Assessment to Students"
      >
        <form onSubmit={handleCreateAssignment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Select Assessment *
            </label>
            <select
              required
              value={selectedTestId}
              onChange={(e) => setSelectedTestId(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="">-- Choose Test --</option>
              {tests.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title} ({t.category} - {t.durationMinutes} mins)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Evaluation Deadline (Optional)
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Student Multi-Select List */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Target Students ({selectedStudentIds.length} selected)
              </label>
              <button
                type="button"
                onClick={handleSelectAllStudents}
                className="text-[11px] text-electric-600 dark:text-electric-400 hover:underline font-medium"
              >
                {selectedStudentIds.length === students.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto p-2 border border-slate-200 dark:border-navy-750 rounded-lg divide-y divide-slate-100 dark:divide-navy-800 bg-slate-50 dark:bg-navy-950">
              {students.map((st) => {
                const isSelected = selectedStudentIds.includes(st.id);
                return (
                  <label
                    key={st.id}
                    className="flex items-center gap-2.5 py-2 px-2 hover:bg-slate-100 dark:hover:bg-navy-850 rounded cursor-pointer transition-colors text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleStudent(st.id)}
                      className="w-3.5 h-3.5 rounded text-electric-600 focus:ring-electric-500"
                    />
                    <div className="flex-1 truncate">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {st.name}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-2">({st.email})</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={actionLoading}>
              Dispatch Assignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TestAssignmentView;
