import React, { useState, useEffect } from 'react';
import Card, { CardBody, CardHeader } from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import Loader from '../common/Loader';
import studentService from '../../services/studentService';
import {
  Award,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Eye,
  Check,
  X,
  Clock,
  CheckSquare,
  AlertCircle
} from 'lucide-react';

const StudentResultsView = ({ onNavigateToTests }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedResult, setSelectedResult] = useState(null);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await studentService.getResults();
      setResults(res.results || []);
    } catch (err) {
      setError(err.message || 'Failed to load test results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  return (
    <div className="space-y-6">
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
              <CheckSquare className="w-4 h-4 text-electric-500" />
              My Official Examination Results ({results.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified scorecards, accuracy telemetry, and question-by-question review
            </p>
          </div>

          <Button variant="ghost" size="sm" onClick={fetchResults} className="text-xs">
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        </CardHeader>

        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader message="Loading your scorecards..." />
          </div>
        ) : results.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-navy-850 text-slate-400 flex items-center justify-center mx-auto">
              <Award className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No Completed Tests Found
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven't completed any assessments yet. Visit Available Tests to take your first evaluation.
            </p>
            {onNavigateToTests && (
              <Button variant="primary" size="sm" onClick={onNavigateToTests} className="text-xs">
                Browse Available Tests
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-850/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Assessment Title</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Accuracy</th>
                  <th className="py-3 px-4">Outcome</th>
                  <th className="py-3 px-4">Time Spent</th>
                  <th className="py-3 px-4">Date Evaluated</th>
                  <th className="py-3 px-4 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-slate-700 dark:text-slate-300">
                {results.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/70 dark:hover:bg-navy-850/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {r.test?.title || 'Assessment'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {r.test?.category}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {r.score} / {r.totalMarks}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold font-mono">{r.percentage}%</span>
                        <div className="w-14 h-1.5 bg-slate-100 dark:bg-navy-800 rounded-full overflow-hidden">
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
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      {formatSeconds(r.timeTakenSeconds)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setSelectedResult(r)}
                        className="text-xs flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Scorecard</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Scorecard Modal */}
      <Modal
        isOpen={!!selectedResult}
        onClose={() => setSelectedResult(null)}
        title="Examination Scorecard & Question Telemetry"
      >
        {selectedResult && (
          <div className="space-y-4 text-xs">
            {/* Header capsule */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-750 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedResult.test?.title}
                </h4>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Category: {selectedResult.test?.category} • Completed on {new Date(selectedResult.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                  {selectedResult.score} / {selectedResult.totalMarks}
                </div>
                {selectedResult.passed ? (
                  <Badge variant="success">PASSED ({selectedResult.percentage}%)</Badge>
                ) : (
                  <Badge variant="danger">FAILED ({selectedResult.percentage}%)</Badge>
                )}
              </div>
            </div>

            {/* Questions breakdown */}
            <div className="space-y-2">
              <div className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                Your Responses Review
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
                      <div className="flex items-center gap-2.5">
                        {ans.isCorrect ? (
                          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-rose-500 flex-shrink-0" />
                        )}
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            Question #{idx + 1}
                          </div>
                          <div className="text-[11px] text-slate-500">
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
                  No individual question answers recorded for this evaluation.
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

export default StudentResultsView;
