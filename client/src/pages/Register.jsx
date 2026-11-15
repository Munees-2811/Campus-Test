import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card, { CardBody } from '../components/common/Card';
import {
  GraduationCap,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  Sun,
  Moon,
  ArrowRight,
  User,
  Mail,
  Lock
} from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please provide all required fields');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const data = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });

      if (data.user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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

      {/* Main Form */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Create an account
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Join CampusTest with role-based access for students and administrators
            </p>
          </div>

          <Card className="shadow-lg border-slate-200 dark:border-navy-800">
            <CardBody className="p-7 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Role Selector */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                    Account Role <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'student' })}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                        formData.role === 'student'
                          ? 'bg-electric-50 dark:bg-electric-950/70 border-electric-600 text-electric-700 dark:text-electric-300 ring-2 ring-electric-500/20 shadow-xs'
                          : 'border-slate-200 dark:border-navy-750 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-navy-850'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'admin' })}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                        formData.role === 'admin'
                          ? 'bg-navy-100 dark:bg-navy-800 border-navy-700 dark:border-electric-500 text-navy-900 dark:text-white ring-2 ring-electric-500/20 shadow-xs'
                          : 'border-slate-200 dark:border-navy-750 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-navy-850'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Admin
                    </button>
                  </div>
                </div>

                <Input
                  label="Full Name"
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  icon={User}
                  value={formData.name}
                  onChange={handleChange}
                />

                <Input
                  label="Campus Email"
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="alex@campus.edu"
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
                  placeholder="Minimum 6 characters"
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
                  placeholder="Repeat password"
                  icon={Lock}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-2.5 font-semibold text-sm mt-1"
                  isLoading={isLoading}
                >
                  <span>Complete Registration</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </form>

              <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-navy-800">
                Already registered?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-electric-600 dark:text-electric-400 hover:underline"
                >
                  Sign in here
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

export default Register;
