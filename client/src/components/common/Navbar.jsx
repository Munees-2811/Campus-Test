import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Badge from './Badge';
import { GraduationCap, LogOut, User as UserIcon } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to={isAdmin ? '/admin/dashboard' : '/student/dashboard'}
            className="flex items-center space-x-3 text-indigo-600 hover:opacity-90 transition-opacity"
          >
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">Campus</span>
              <span className="text-xl font-bold tracking-tight text-indigo-600">Test</span>
            </div>
          </Link>

          {/* User actions */}
          {isAuthenticated && (
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2.5 text-right">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-semibold text-slate-800 leading-tight">
                    {user?.name}
                  </span>
                  <span className="text-xs text-slate-500">{user?.email}</span>
                </div>
                <Badge variant={user?.role === 'admin' ? 'admin' : 'student'}>
                  {user?.role?.toUpperCase()}
                </Badge>
              </div>

              <button
                onClick={handleLogout}
                title="Log out"
                className="flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
