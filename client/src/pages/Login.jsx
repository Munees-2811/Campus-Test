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
  CheckCircle2
} from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

      if (data.user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-navy-950 transition-colors">
      {/* Top Navbar */}
      <header className="h-16 px-6 sm:px-12 flex items-center justify-between border-b border-slate-200/80 dark:border-navy-800">
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
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-850 transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-navy-800" />
          )}
        </button>
      </header>

      {/* Main Login Form Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-electric-50 dark:bg-electric-950/70 border border-electric-200/80 dark:border-electric-900 text-electric-700 dark:text-electric-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Campus Assessment & Testing</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Sign in to your account
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Access your college evaluations, records, and examination dashboard
            </p>
          </div>

          <Card className="shadow-lg border-slate-200 dark:border-navy-800">
            <CardBody className="p-7 space-y-5">
              {isSessionExpired && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Session expired. Please sign in again.</span>
                </div>
              )}

              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
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
                />

                <Input
                  label="Password"
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  icon={Lock}
                  value={formData.password}
                  onChange={handleChange}
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-2.5 font-semibold text-sm"
                  isLoading={isLoading}
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </form>

              {/* Quick Fill Demo Credentials */}
              <div className="pt-4 border-t border-slate-100 dark:border-navy-800 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center">
                  Demo Fast Sign-In
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fillCredentials('admin@campus.edu', 'Password123!')}
                    className="px-2.5 py-1.5 text-xs bg-slate-100 dark:bg-navy-850 hover:bg-slate-200 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium border border-slate-200/80 dark:border-navy-750 transition-colors text-center"
                  >
                    Fill Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => fillCredentials('student@campus.edu', 'Password123!')}
                    className="px-2.5 py-1.5 text-xs bg-slate-100 dark:bg-navy-850 hover:bg-slate-200 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium border border-slate-200/80 dark:border-navy-750 transition-colors text-center"
                  >
                    Fill Student
                  </button>
                </div>
              </div>

              <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
                New to CampusTest?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-electric-600 dark:text-electric-400 hover:underline"
                >
                  Create an account
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-400 dark:text-slate-600">
        CampusTest Assessment Platform • Powered by PostgreSQL
      </footer>
    </div>
  );
};

export default Login;
