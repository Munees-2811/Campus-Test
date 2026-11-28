import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Loader from '../common/Loader';
import studentService from '../../services/studentService';
import {
  Clock,
  Calendar,
  Award,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Search,
  RotateCcw,
  Sparkles,
  Lock,
  Code2,
  Bug,
  Cpu,
  Brain,
  Database,
  FileText,
  Timer,
  Check
} from 'lucide-react';

const AssignedTestsView = ({
  category = null, // null for all assigned, or 'coding', 'debugging', 'technical', 'aptitude', 'sql'
  isUpcomingOnly = false,
  title,
  subtitle,
  icon: SectionIcon = FileText
}) => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const navigate = useNavigate();

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError('');
      let res;
      if (category) {
        res = await studentService.getArenaTests(category);
      } else if (isUpcomingOnly) {
        res = await studentService.getUpcomingTests();
      } else {
        res = await studentService.getAssignedTests();
      }
      setTests(res.tests || []);
    } catch (err) {
      setError(err.message || 'Failed to load assigned assessments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [category, isUpcomingOnly]);

  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      if (t.alreadySubmitted || t.assignmentStatus === 'completed') return false;
      const q = search.toLowerCase();
      return (
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      );
    });
  }, [tests, search]);

  const getArenaBadge = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'coding':
        return <Badge variant="primary" className="flex items-center gap-1"><Code2 className="w-3 h-3" /> Coding Arena</Badge>;
      case 'debugging':
        return <Badge variant="danger" className="flex items-center gap-1"><Bug className="w-3 h-3" /> Debugging Arena</Badge>;
      case 'technical':
        return <Badge variant="indigo" className="flex items-center gap-1"><Cpu className="w-3 h-3" /> Technical Quiz</Badge>;
      case 'aptitude':
        return <Badge variant="amber" className="flex items-center gap-1"><Brain className="w-3 h-3" /> Aptitude Test</Badge>;
      case 'sql':
        return <Badge variant="emerald" className="flex items-center gap-1"><Database className="w-3 h-3" /> SQL Test</Badge>;
      default:
        return <Badge variant="outline">{cat || 'Assessment'}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Search */}
      <Card className="border-slate-200 dark:border-navy-800">
        <CardBody className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-electric-50 dark:bg-electric-950/70 text-electric-600 dark:text-electric-400 flex items-center justify-center flex-shrink-0">
              <SectionIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{title}</span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-navy-850 text-slate-600 dark:text-slate-400">
                  {filteredTests.length} Assigned
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {subtitle || 'Exclusively showing assessments provisioned for your student ID'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-electric-500"
              />
            </div>
            <Button variant="ghost" size="sm" onClick={fetchTests} className="text-xs">
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Error state */}
      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader message="Querying assigned student evaluations..." />
        </div>
      ) : filteredTests.length === 0 ? (
        /* Empty state */
        <Card className="border-slate-200 dark:border-navy-800">
          <CardBody className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-navy-850 text-slate-400 flex items-center justify-center mx-auto">
              <SectionIcon className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No Assessments Found in this Section
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You currently have no tests assigned under this evaluation arena. Check back later when your instructor assigns new assessments.
            </p>
          </CardBody>
        </Card>
      ) : (
        /* Test Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTests.map((t) => (
            <Card
              key={t.id || t._id}
              className="border-slate-200 dark:border-navy-800 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group"
            >
              <CardBody className="p-5 space-y-4">
                {/* Header Type Badge & Status */}
                <div className="flex items-center justify-between gap-2">
                  {getArenaBadge(t.category)}
                  {t.alreadySubmitted ? (
                    <Badge variant="success" className="flex items-center gap-1 font-mono text-[10px]">
                      <Check className="w-3 h-3" /> Score: {t.previousResult?.score}/{t.totalMarks} ({t.previousResult?.percentage}%)
                    </Badge>
                  ) : isUpcomingOnly ? (
                    <Badge variant="secondary" className="flex items-center gap-1 text-[10px]">
                      <Clock className="w-3 h-3" /> Upcoming
                    </Badge>
                  ) : (
                    <Badge variant="primary" className="text-[10px]">
                      Available Now
                    </Badge>
                  )}
                </div>

                {/* Title & Description */}
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-electric-600 dark:group-hover:text-electric-400 transition-colors line-clamp-1">
                    {t.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {t.description || 'Institutional college evaluation assessment.'}
                  </p>
                </div>

                {/* 5 Explicit Metadata Metrics (Required: Duration, Start Time, End Time, Total Marks, Assessment Type) */}
                <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded-xl border border-slate-100 dark:border-navy-800 space-y-2 text-xs">
                  {/* Duration & Assessment Type */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Timer className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px]">Duration:</span>
                      <span className="font-bold font-mono">{t.durationMinutes} Mins</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {t.questionsCount} Questions
                    </div>
                  </div>

                  {/* Total Marks & Pass Mark */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[11px]">Total Marks:</span>
                      <span className="font-bold font-mono text-slate-900 dark:text-white">{t.totalMarks} Pts</span>
                    </div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Pass: {t.passMarks} Pts
                    </div>
                  </div>

                  {/* Start Time & End Time */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-navy-850 space-y-1 font-mono text-[10px]">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <span>Window Start:</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {t.startTime ? new Date(t.startTime).toLocaleDateString() : 'Immediate'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <span>Window End:</span>
                      <span className={t.endTime ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-slate-700 dark:text-slate-300'}>
                        {t.endTime ? new Date(t.endTime).toLocaleDateString() : 'Open Access'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="pt-1">
                  {t.alreadySubmitted ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/student/dashboard?tab=results')}
                      className="w-full text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Review Scorecard ({t.previousResult?.percentage}%)</span>
                    </Button>
                  ) : isUpcomingOnly ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="w-full text-xs opacity-75 flex items-center justify-center gap-1.5 cursor-not-allowed"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Scheduled Evaluation</span>
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/student/test/${t.id || t._id}`)}
                      className="w-full text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm shadow-electric-500/20"
                    >
                      <span>Start Assessment</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignedTestsView;
