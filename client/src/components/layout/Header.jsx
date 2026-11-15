import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Badge from '../common/Badge';
import {
  Menu,
  Sun,
  Moon,
  Bell,
  Search,
  Sparkles,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

const Header = ({ onOpenSidebar, title, subtitle, searchVal, setSearchVal }) => {
  const { user, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-navy-900/95 backdrop-blur-sm border-b border-slate-200/90 dark:border-navy-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-colors">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
            {title || 'Dashboard'}
          </h1>
          {subtitle && (
            <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Search, Theme, Notifications & User */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {setSearchVal !== undefined && (
          <div className="relative hidden md:block w-48 lg:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search assessments..."
              value={searchVal || ''}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-navy-750 rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-electric-500"
            />
          </div>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-navy-800" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            title="Notifications"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-electric-600 dark:bg-electric-400" />
          </button>
        </div>

        {/* User Pill */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-navy-800">
          <div className="w-8 h-8 rounded-full bg-navy-900 dark:bg-electric-600 text-white font-bold text-xs flex items-center justify-center">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
              {user?.name}
            </span>
            <span className="text-[10px] text-slate-400 font-medium uppercase">
              {user?.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
