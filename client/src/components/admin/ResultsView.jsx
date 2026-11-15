import React, { useState, useEffect, useMemo } from 'react';
import Card, { CardBody, CardHeader } from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import Loader from '../common/Loader';
import adminService from '../../services/adminService';
import testService from '../../services/testService';
import {
  Award,
  Search,
  Filter,
  Download,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Eye,
  Check,
  X,
  Clock,
  CheckSquare
} from 'lucide-react';

const ResultsView = () => {
  const [results, setResults] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [testFilter, setTestFilter] = useState('ALL');
  const [passFilter, setPassFilter] = useState('ALL');

  // Modal
  const [selectedResult, setSelectedResult] = useState(null);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError('');
      const [resData, testData] = await Promise.all([
        adminService.getResults(),
        testService.getTests()
      ]);
      setResults(resData.results || []);
      setTests(testData.tests || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      const matchSearch =
        r.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.student?.email?.toLowerCase().includes(search.toLowerCase()) ||
        r.test?.title?.toLowerCase().includes(search.toLowerCase());

      const matchTest = testFilter === 'ALL' || r.test?.id === testFilter;
      const matchPass =
        passFilter === 'ALL' ||
        (passFilter === 'passed' && r.passed) ||
        (passFilter === 'failed' && !r.passed);

      return matchSearch && matchTest && matchPass;
    });
  }, [results, search, testFilter, passFilter]);

  const handleExportCSV = () => {
    if (filteredResults.length === 0) return;

    const headers = ['Student Name', 'Email', 'Assessment', 'Score', 'Total Marks', 'Percentage', 'Status', 'Time Taken (sec)', 'Completed At'];
    const rows = filteredResults.map((r) => [
      `"${r.student?.name || ''}"`,
      `"${r.student?.email || ''}"`,
      `"${r.test?.title || ''}"`,
      r.score,
      r.totalMarks,
      `${r.percentage}%`,
      r.passed ? 'PASSED' : 'FAILED',
      r.timeTakenSeconds,
      `"${new Date(r.createdAt).toISOString()}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `campustest_results_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="border-slate-200 dark:border-navy-800">
        <CardBody className="p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-1 w-full flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student or test title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-electric-500"
              />
            </div>

            <select
              value={testFilter}
              onChange={(e) => setTestFilter(e.target.value)}
              className="w-full sm:w-auto py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-950 text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">All Assessments</option>
              {tests.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title}
                </option>
              ))}
            </select>

            <select
              value={passFilter}
              onChange={(e) => setPassFilter(e.target.value)}
              className="w-full sm:w-auto py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-950 text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">All Outcomes</option>
              <option value="passed">Passed Only</option>
              <option value="failed">Failed Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={filteredResults.length === 0}
              className="text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Results Table */}
      <Card className="border-slate-200 dark:border-navy-800 shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 dark:border-navy-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-electric-500" />
              Student Evaluation Records ({filteredResults.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified test scorecards, timestamps, and question response telemetry
            </p>
          </div>

          <Button variant="ghost" size="sm" onClick={fetchResults} className="text-xs">
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        </CardHeader>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader message="Loading scorecards..." />
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
              No results found matching your query.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-850/60 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-navy-800 uppercase font-semibold tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Assessment</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Percentage</th>
                  <th className="py-3 px-4">Outcome</th>
                  <th className="py-3 px-4">Time Taken</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-slate-700 dark:text-slate-300">
                {filteredResults.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/70 dark:hover:bg-navy-850/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {r.student?.name || 'Student'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {r.student?.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {r.test?.title || 'Assessment'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {r.test?.category}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {r.score} / {r.totalMarks}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{r.percentage}%</span>
                        <div className="w-12 h-1.5 bg-slate-100 dark:bg-navy-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${r.passed ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            style={{ width: `${r.percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {r.passed ? (
                        <Badge variant="success">Passed</Badge>
                      ) : (
                        <Badge variant="danger">Failed</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {formatSeconds(r.timeTakenSeconds)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(r.createdAt).toLocaleDateString()} {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setSelectedResult(r)}
                        className="flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Scorecard</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Scorecard Modal */}
      <Modal
        isOpen={!!selectedResult}
        onClose={() => setSelectedResult(null)}
        title="Student Examination Scorecard"
      >
        {selectedResult && (
          <div className="space-y-4 text-xs">
            {/* Header banner */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-750 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedResult.student?.name}
                </h4>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {selectedResult.student?.email} • {selectedResult.test?.title}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                  {selectedResult.score} / {selectedResult.totalMarks}
                </div>
                {selectedResult.passed ? (
                  <Badge variant="success">PASSED ({selectedResult.percentage}%)</Badge>
                ) : (
                  <Badge variant="danger">FAILED ({selectedResult.percentage}%)</Badge>
                )}
              </div>
            </div>

            {/* Answers List */}
            <div className="space-y-2">
              <div className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                Question Responses Telemetry
              </div>

              {selectedResult.answers && selectedResult.answers.length > 0 ? (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {selectedResult.answers.map((ans, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border flex items-center justify-between ${
                        ans.isCorrect
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                          : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {ans.isCorrect ? (
                          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-rose-500 flex-shrink-0" />
                        )}
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            Question #{idx + 1}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Selected Option: {ans.selectedOption !== undefined ? String.fromCharCode(65 + ans.selectedOption) : 'Unanswered'}
                          </div>
                        </div>
                      </div>

                      <div className="font-mono text-xs font-semibold">
                        {ans.isCorrect ? (
                          <span className="text-emerald-600">+1 Mark</span>
                        ) : (
                          <span className="text-rose-500">0 Marks</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400 italic text-center py-4">
                  No question-level response telemetry recorded for this assessment.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedResult(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ResultsView;
