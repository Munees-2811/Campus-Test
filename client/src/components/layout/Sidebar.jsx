import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Badge from '../common/Badge';
import {
  GraduationCap,
  LayoutDashboard,
  FileText,
  Award,
  BarChart3,
  LogOut,
  Sun,
  Moon,
  X,
  ShieldCheck,
  UserCheck,
  CheckCircle2
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose, activeTab, setActiveTab }) => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminNav = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'assessments', label: 'Assessments', icon: FileText },
    { id: 'analytics', label: 'Performance Analytics', icon: BarChart3 },
  ];

  const studentNav = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'tests', label: 'Available Tests', icon: FileText },
    { id: 'history', label: 'My Results', icon: Award },
    { id: 'analytics', label: 'Score Analytics', icon: BarChart3 },
  ];

  const navItems = isAdmin ? adminNav : studentNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-navy-900 border-r border-slate-200/90 dark:border-navy-800 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand & Top Bar */}
        <div>
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 dark:border-navy-800">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-navy-900 dark:bg-electric-600 flex items-center justify-center text-electric-400 dark:text-white shadow-sm shadow-electric-500/20">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                  Campus<span className="text-electric-600 dark:text-electric-400">Test</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mt-1">
                  {isAdmin ? 'Admin Console' : 'Student Portal'}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Menu
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (setActiveTab) setActiveTab(item.id);
                    if (onClose) onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-electric-50 text-electric-700 dark:bg-electric-950/60 dark:text-electric-300 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-850 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? 'text-electric-600 dark:text-electric-400'
                          : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-electric-600 dark:bg-electric-400" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-3 space-y-3 border-t border-slate-100 dark:border-navy-800">
          {/* Status badge */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-navy-850/70 rounded-lg border border-slate-100 dark:border-navy-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">PostgreSQL Engine</span>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </span>
          </div>

          {/* Theme switch & user bar */}
          <div className="flex items-center justify-between px-2 pt-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Appearance</span>
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-navy-750 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-navy-800" />
              )}
            </button>
          </div>

          {/* User profile row */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-navy-850 border border-slate-100 dark:border-navy-800">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-electric-600/10 dark:bg-electric-400/10 text-electric-600 dark:text-electric-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden text-left">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {user?.name}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
