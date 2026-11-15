import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ChangePasswordModal from '../common/ChangePasswordModal';
import {
  GraduationCap,
  LayoutDashboard,
  Radio,
  BarChart3,
  FileText,
  BookOpen,
  Send,
  Calendar,
  Users,
  FileSpreadsheet,
  CheckSquare,
  Trophy,
  Bell,
  Settings,
  Award,
  LogOut,
  Sun,
  Moon,
  X,
  KeyRound,
  ShieldCheck,
  Code2,
  Bug,
  Cpu,
  Brain,
  Database,
  User,
  Clock
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose, activeTab, setActiveTab }) => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 13 Complete Sections for Admin Portal
  const adminSections = [
    {
      group: 'Overview & Intel',
      items: [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'monitoring', label: 'Live Monitoring', icon: Radio, badge: 'Live' },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 }
      ]
    },
    {
      group: 'Academic Operations',
      items: [
        { id: 'tests', label: 'Test Management', icon: FileText },
        { id: 'questions', label: 'Question Bank', icon: BookOpen },
        { id: 'assignments', label: 'Test Assignment', icon: Send },
        { id: 'schedules', label: 'Schedule Management', icon: Calendar }
      ]
    },
    {
      group: 'Student Directory',
      items: [
        { id: 'students', label: 'Student Management', icon: Users },
        { id: 'bulk-import', label: 'Bulk Student Import', icon: FileSpreadsheet },
        { id: 'results', label: 'Results', icon: CheckSquare },
        { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
      ]
    },
    {
      group: 'Administration',
      items: [
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'settings', label: 'Settings', icon: Settings }
      ]
    }
  ];

  // 13 Complete Sections for Student Portal
  const studentSections = [
    {
      group: 'Core Portal',
      items: [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'tests', label: 'Available Tests', icon: FileText },
        { id: 'upcoming', label: 'Upcoming Tests', icon: Calendar }
      ]
    },
    {
      group: 'Evaluation Arenas',
      items: [
        { id: 'coding', label: 'Coding Arena', icon: Code2, badge: 'Code' },
        { id: 'debugging', label: 'Debugging Arena', icon: Bug, badge: 'Debug' },
        { id: 'technical', label: 'Technical Quiz', icon: Cpu },
        { id: 'aptitude', label: 'Aptitude Test', icon: Brain },
        { id: 'sql', label: 'SQL Test', icon: Database }
      ]
    },
    {
      group: 'Performance & Standings',
      items: [
        { id: 'results', label: 'My Results', icon: CheckSquare },
        { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
        { id: 'analytics', label: 'Score Analytics', icon: BarChart3 }
      ]
    },
    {
      group: 'Account & Alerts',
      items: [
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'profile', label: 'My Profile', icon: User }
      ]
    }
  ];

  const sections = isAdmin ? adminSections : studentSections;

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
        <div className="flex-1 flex flex-col min-h-0">
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 dark:border-navy-800 flex-shrink-0">
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

          {/* Navigation Links (Scrollable) */}
          <nav className="p-3 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
            {sections.map((sec, sIdx) => (
              <div key={sIdx} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {sec.group}
                </div>
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    activeTab === item.id ||
                    (item.id === 'overview' && activeTab === 'dashboard') ||
                    (item.id === 'results' && activeTab === 'history');

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (setActiveTab) setActiveTab(item.id);
                        if (onClose) onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                        isActive
                          ? 'bg-electric-50 text-electric-700 dark:bg-electric-950/60 dark:text-electric-300 font-semibold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-850 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={`w-4 h-4 flex-shrink-0 transition-colors ${
                            isActive
                              ? 'text-electric-600 dark:text-electric-400'
                              : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge ? (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-electric-100 text-electric-700 dark:bg-electric-950/70 dark:text-electric-300">
                          {item.badge}
                        </span>
                      ) : isActive ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-electric-600 dark:bg-electric-400" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-3 space-y-2 border-t border-slate-100 dark:border-navy-800 flex-shrink-0">
          {/* Security: Change Password Trigger */}
          <button
            onClick={() => setIsChangePasswordOpen(true)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-850 rounded-lg transition-colors font-medium"
          >
            <span className="flex items-center gap-2">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              <span>Change Password</span>
            </span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Security</span>
          </button>

          {/* Theme switch & status */}
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Theme</span>
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-navy-750 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-navy-800" />
              )}
            </button>
          </div>

          {/* User profile capsule */}
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-100 dark:border-navy-750 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-navy-900 dark:bg-electric-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {user?.name || 'Student'}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                  {user?.email || 'student@campus.edu'}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </>
  );
};

export default Sidebar;
