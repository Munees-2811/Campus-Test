import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card, { CardBody } from '../components/common/Card';
import {
  GraduationCap,
  AlertCircle,
  Sun,
  Moon,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const isSessionExpired = new URLSearchParams(location.search).get('expired');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const fillCredentials = (email, password) => {
    setFormData({ email, password });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const data = await login(formData);
      setLoginSuccess(true);

      setTimeout(() => {
        if (data.user.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/student/dashboard', { replace: true });
        }
      }, 500);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-navy-950 transition-colors">

      {/* ── Top Navbar ── */}
      <header className="h-16 px-6 sm:px-12 flex items-center justify-between border-b border-slate-200/80 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-navy-900 dark:bg-electric-600 flex items-center justify-center text-white shadow-xs">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            Campus<span className="text-electric-600 dark:text-electric-400">Test</span>
          </span>
        </div>

        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-navy-800" />
          )}
        </button>
      </header>

      {/* ── Main Login Form ── */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">

          {/* Heading */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-electric-50 dark:bg-electric-950/70 border border-electric-200/80 dark:border-electric-900 text-electric-700 dark:text-electric-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Campus Assessment & Testing</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-2">
              Sign in to your account
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Access your college evaluations, records, and examination dashboard
            </p>
          </div>

          {/* Card */}
          <Card className="shadow-lg border-slate-200 dark:border-navy-800">
            <CardBody className="p-7 space-y-5">

              {/* Session expired alert */}
              {isSessionExpired && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Session expired. Please sign in again.</span>
                </div>
              )}

              {/* Error alert */}
              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Success alert */}
              {loginSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Login successful! Redirecting…</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Email */}
                <Input
                  label="Campus Email"
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="name@campus.edu"
                  icon={Mail}
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-electric-600 dark:text-electric-400 hover:underline font-medium"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      autoComplete="current-password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-10 py-2 text-sm bg-white dark:bg-navy-850 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-navy-750 rounded-lg shadow-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-electric-500/20 focus:border-electric-500 dark:focus:border-electric-400 transition-colors"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-2.5 font-semibold text-sm"
                  disabled={isLoading || loginSuccess}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing in…</span>
                    </>
                  ) : loginSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Success!</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </>
                  )}
                </Button>
              </form>

              {/* Demo credentials */}
              <div className="pt-4 border-t border-slate-100 dark:border-navy-800 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center">
                  Demo Fast Sign-In
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fillCredentials('admin@campus.edu', 'Password123!')}
                    className="px-2.5 py-2 text-xs bg-slate-100 dark:bg-navy-850 hover:bg-slate-200 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium border border-slate-200/80 dark:border-navy-750 transition-colors text-center space-y-0.5"
                  >
                    <div className="font-semibold">Admin Demo</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">admin@campus.edu</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillCredentials('student@campus.edu', 'Password123!')}
                    className="px-2.5 py-2 text-xs bg-slate-100 dark:bg-navy-850 hover:bg-slate-200 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium border border-slate-200/80 dark:border-navy-750 transition-colors text-center space-y-0.5"
                  >
                    <div className="font-semibold">Student Demo</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">student@campus.edu</div>
                  </button>
                </div>
              </div>

              {/* Info note */}
              <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                Student accounts are provisioned by your institution admin.
              </div>

              {/* Admin register link */}
              <div className="pt-3 border-t border-slate-100 dark:border-navy-800 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Setting up for the first time?{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-electric-600 dark:text-electric-400 hover:underline"
                  >
                    Create Admin Account →
                  </Link>
                </p>
              </div>

            </CardBody>
          </Card>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="py-4 text-center text-xs text-slate-400 dark:text-slate-600 border-t border-slate-200/60 dark:border-navy-800">
        CampusTest Assessment Platform • Powered by PostgreSQL
      </footer>
    </div>
  );
};

export default Login;
