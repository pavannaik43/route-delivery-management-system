import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Truck,
  PackageCheck,
  Boxes,
  FileText,
  CalendarCheck,
  Package,
  Store,
  BarChart3,
  Users,
  Mail,
  LogOut,
  Shield,
  UserCheck
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      label: 'Operations',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, role: 'admin' },
        { name: 'Load Vehicle', path: '/load', icon: Truck, role: 'all' },
        { name: 'New Delivery', path: '/deliver', icon: PackageCheck, role: 'all' },
        { name: 'Live Stock', path: '/stock', icon: Boxes, role: 'all' },
        { name: 'Invoices', path: '/invoices', icon: FileText, role: 'all' },
        { name: 'Day Summary', path: '/summary', icon: CalendarCheck, role: 'all' },
      ]
    },
    {
      label: 'Master Data & Analytics',
      adminOnly: true,
      items: [
        { name: 'Products Catalog', path: '/products', icon: Package, role: 'admin' },
        { name: 'Shops & Routes', path: '/shops', icon: Store, role: 'admin' },
        { name: 'Reports & Trends', path: '/reports', icon: BarChart3, role: 'admin' },
        { name: 'User Management', path: '/users', icon: Users, role: 'admin' },
        { name: 'Email Service', path: '/mail', icon: Mail, role: 'admin' },
      ]
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-[#0A2540] text-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-700/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl shadow-lg border border-white/20">
            H
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight tracking-wide">HATSUN AGRO</h1>
            <p className="text-[11px] font-medium text-sky-400">RDMS — Route Delivery</p>
          </div>
        </div>

        {/* User Info Capsule */}
        <div className="px-4 py-3 mx-3 my-3 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-primary/30 border border-primary/50 text-sky-300 flex items-center justify-center font-bold text-xs">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user?.username}</p>
              <p className="text-[10px] text-slate-400 capitalize flex items-center gap-1">
                {isAdmin ? (
                  <>
                    <Shield className="w-2.5 h-2.5 text-amber-400" /> Admin
                  </>
                ) : (
                  <>
                    <UserCheck className="w-2.5 h-2.5 text-emerald-400" /> Delivery Staff
                  </>
                )}
              </p>
            </div>
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
              isAdmin ? 'bg-amber-400/20 text-amber-300' : 'bg-emerald-400/20 text-emerald-300'
            }`}
          >
            {isAdmin ? 'ADM' : 'STAFF'}
          </span>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
          {navItems.map((group, gIdx) => {
            if (group.adminOnly && !isAdmin) return null;

            return (
              <div key={gIdx} className="space-y-1">
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {group.label}
                </p>
                {group.items.map((item) => {
                  if (item.role === 'admin' && !isAdmin) return null;
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => {
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                          isActive
                            ? 'bg-primary text-white font-semibold shadow-md shadow-primary/30 translate-x-1'
                            : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Logout Footer */}
        <div className="p-3 border-t border-slate-700/60">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 border border-transparent transition-colors duration-150"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
