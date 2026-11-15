import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card, { CardBody } from '../components/common/Card';
import { useTheme } from '../context/ThemeContext';
import authService from '../services/authService';
import {
  GraduationCap,
  KeyRound,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  ShieldCheck
} from 'lucide-react';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const queryToken = new URLSearchParams(location.search).get('token') || '';

  const [token, setToken] = useState(queryToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (queryToken) {
      setToken(queryToken);
    }
  }, [queryToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('A valid password reset token is required.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.resetPassword({
        token,
        newPassword,
        confirmPassword
      });
      setSuccess(res.message || 'Password has been reset successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired or already been used.');
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
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Create New Password
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter your verified reset credentials to restore account access
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

              {success ? (
                <div className="p-5 text-center space-y-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Password Successfully Reset
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {success} Redirecting to sign in screen...
                    </p>
                  </div>
                  <Button variant="primary" className="w-full" onClick={() => navigate('/login')}>
                    Sign In Now
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!queryToken && (
                    <Input
                      label="Reset Security Token"
                      type="text"
                      required
                      placeholder="Paste your reset token..."
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                    />
                  )}

                  <Input
                    label="New Password"
                    type="password"
                    icon={Lock}
                    required
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />

                  <Input
                    label="Confirm New Password"
                    type="password"
                    icon={Lock}
                    required
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-2.5 font-semibold text-sm"
                    isLoading={loading}
                  >
                    <span>Update & Save Password</span>
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

export default ResetPassword;
