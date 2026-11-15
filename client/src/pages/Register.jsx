import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card, { CardBody } from '../components/common/Card';
import {
  GraduationCap,
  ShieldCheck,
  User,
  Mail,
  Lock,
  KeyRound,
  ArrowRight,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';

const DEFAULT_ADMIN_SECRET = 'campustest_secure_admin_init_secret_2026';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminInitSecret: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { registerAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleFillDefaultSecret = () => {
    setFormData({ ...formData, adminInitSecret: DEFAULT_ADMIN_SECRET });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setError('Please provide full name, email, and password.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      await registerAdmin({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        adminInitSecret: formData.adminInitSecret.trim()
      });

      setSuccess('Administrator account created successfully! Redirecting to Dashboard...');
      setTimeout(() => {
        navigate('/admin/dashboard', { replace: true });
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to initialize administrator account. Please verify credentials and security key.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-navy-950 transition-colors">
      {/* Top Navbar */}
      <header className="h-16 px-6 sm:px-12 flex items-center justify-between border-b border-slate-200/80 dark:border-navy-800">
        <Link to="/login" className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-navy-900 dark:bg-electric-600 flex items-center justify-center text-white shadow-xs">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            Campus<span className="text-electric-600 dark:text-electric-400">Test</span>
          </span>
        </Link>

        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-850 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-navy-800" />}
        </button>
      </header>

      {/* Main Registration Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg space-y-5">
          {/* Header */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-electric-50 dark:bg-electric-950/70 border border-electric-200/80 dark:border-electric-900 text-electric-700 dark:text-electric-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Administrator Account Setup</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Create Admin Account
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Provision institutional administrator credentials to conduct assessments
            </p>
          </div>

          {/* Student Advisory Box */}
          <div className="p-3.5 bg-blue-50/70 dark:bg-navy-900/60 border border-blue-200/70 dark:border-navy-750 rounded-xl flex items-start gap-3">
            <Info className="w-4 h-4 text-electric-600 dark:text-electric-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-white">Are you a Student?</span> Students do not create accounts here. Students are provisioned directly by institution administrators. If enrolled, please{' '}
              <Link to="/login" className="font-semibold text-electric-600 dark:text-electric-400 hover:underline">
                Sign in here →
              </Link>
            </div>
          </div>

          <Card className="shadow-lg border-slate-200 dark:border-navy-800">
            <CardBody className="p-7 space-y-5">
              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Administrator Full Name"
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Dr. Sarah Jenkins"
                  icon={User}
                  value={formData.name}
                  onChange={handleChange}
                />

                <Input
                  label="Campus Admin Email"
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="admin@campus.edu"
                  icon={Mail}
                  value={formData.email}
                  onChange={handleChange}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                  <Input
                    label="Confirm Password"
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    placeholder="••••••••"
                    icon={Lock}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Admin Security Passcode
                    </label>
                    <button
                      type="button"
                      onClick={handleFillDefaultSecret}
                      className="text-[11px] text-electric-600 dark:text-electric-400 hover:underline font-medium"
                    >
                      Fill Default Campus Key
                    </button>
                  </div>
                  <Input
                    id="adminInitSecret"
                    name="adminInitSecret"
                    type="password"
                    placeholder="Enter institution admin security key"
                    icon={KeyRound}
                    value={formData.adminInitSecret}
                    onChange={handleChange}
                  />
                  <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                    Required for campus verification if an administrator already exists on this server.
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-2.5 font-semibold text-sm mt-2"
                  isLoading={isLoading}
                >
                  <span>Create Admin Account</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </form>

              <div className="pt-4 border-t border-slate-100 dark:border-navy-800 text-center text-xs text-slate-500 dark:text-slate-400">
                Already have an administrator or student account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-electric-600 dark:text-electric-400 hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-400 dark:text-slate-600">
        CampusTest Assessment Platform • Institutional Access
      </footer>
    </div>
  );
};

export default Register;
