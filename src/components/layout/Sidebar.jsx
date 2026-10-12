import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  AlertTriangle,
  ListFilter,
  BarChart3,
  Info,
  Shield,
  X
} from 'lucide-react';

export const Sidebar = ({ isOpen = false, onClose }) => {
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Upload & Analyze Logs', path: '/analysis', icon: Upload },
    { label: 'Threat Alerts', path: '/alerts', icon: AlertTriangle },
    { label: 'Log Browser', path: '/logs', icon: ListFilter },
    { label: 'Model Performance', path: '/models', icon: BarChart3 },
    { label: 'About', path: '/about', icon: Info },
  ];

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full min-h-screen bg-white">
      <div>
        {/* Logo block */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900 leading-snug">
                Log Threat Detection
              </h1>
              <p className="text-xs text-slate-500">Security Telemetry Analysis</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Sidebar footer plain note */}
      <div className="p-4 border-t border-slate-200">
        <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600">
          Dataset: 6,000,000 log records (CSV)
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-slate-200 flex-col shrink-0 min-h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/30 transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="relative w-64 max-w-[80vw] bg-white border-r border-slate-200 shadow-xl z-10 flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
