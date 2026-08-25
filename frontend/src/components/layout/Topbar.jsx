import React from 'react';
import { Menu, Calendar, Sparkles, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Topbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3 flex items-center justify-between shadow-sm">
      {/* Left section: mobile toggle and page title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-primary border border-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Live Sync Active
          </span>
        </div>
      </div>

      {/* Right section: current date, quick delivery CTA, and user badge */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Date Display */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{todayStr}</span>
        </div>

        {/* Quick New Delivery CTA */}
        <button
          type="button"
          onClick={() => navigate('/deliver')}
          className="hidden md:inline-flex items-center gap-1.5 bg-secondary hover:bg-secondary-hover text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all"
        >
          + Quick Deliver
        </button>

        {/* User Info & Quick Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-sm">
            {user?.username?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-tight">{user?.username}</p>
            <p className="text-[10px] text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
