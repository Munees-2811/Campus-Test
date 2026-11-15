import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card, { CardBody } from '../components/common/Card';
import { useTheme } from '../context/ThemeContext';
import authService from '../services/authService';
import {
  GraduationCap,
  KeyRound,
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  ExternalLink
} from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [loading, setLoading] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your registered campus email.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await authService.forgotPassword(email);
      setSuccessData(res);
    } catch (err) {
      setError(err.message || 'Failed to process password reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-navy-950 transition-colors">
      {/* Header */}
      <header className="h-16 px-6 sm:px-12 flex items-center justify-between border-b border-slate-200/80 dark:border-navy-800">
        <Link to="/login" className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-navy-900 dark:bg-electric-600 flex items-center justify-center text-white">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            Campus<span className="text-electric-600 dark:text-electric-400">Test</span>
          </span>
        </Link>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-850"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-navy-800" />}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-electric-50 dark:bg-electric-950/70 border border-electric-200 dark:border-electric-900 text-electric-600 dark:text-electric-400 flex items-center justify-center mx-auto shadow-xs">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Forgot your password?
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter your verified campus email to generate a secure recovery token
            </p>
          </div>

          <Card className="shadow-lg border-slate-200 dark:border-navy-800">
            <CardBody className="p-7 space-y-5">
              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successData ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl space-y-2">
                    <div className="flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Password Recovery Link Ready</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      A cryptographically signed, one-time reset token has been generated.
                    </p>
                  </div>

                  {successData.resetToken && (
                    <div className="p-3 bg-slate-50 dark:bg-navy-850 rounded-lg border border-slate-200 dark:border-navy-750 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <span>One-Time Reset Token</span>
                        <span className="text-emerald-600 dark:text-emerald-400">Valid for 15 mins</span>
                      </div>
                      <div className="p-2 bg-white dark:bg-navy-900 rounded font-mono text-[10px] break-all border border-slate-100 dark:border-navy-800 text-slate-700 dark:text-slate-300">
                        {successData.resetToken}
                      </div>
                    </div>
                  )}

                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => navigate(`/reset-password?token=${encodeURIComponent(successData.resetToken || '')}`)}
                  >
                    <span>Proceed to Reset Password</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Campus Email Address"
                    id="email"
                    type="email"
                    required
                    placeholder="name@campus.edu"
                    icon={Mail}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-2.5 font-semibold text-sm"
                    isLoading={loading}
                  >
                    <span>Send Recovery Instructions</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </form>
              )}

              <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 font-medium text-electric-600 dark:text-electric-400 hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-400 dark:text-slate-600">
        CampusTest Assessment Platform
      </footer>
    </div>
  );
};

export default ForgotPassword;
