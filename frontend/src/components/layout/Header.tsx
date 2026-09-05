import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  Bell, 
  ChevronDown, 
  LogOut, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  CreditCard,
  Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { QuickAttendanceWidget } from './QuickAttendanceWidget';
import { GlobalSearchModal } from '../ui/GlobalSearchModal';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileSidebar }) => {
  const { user, logout, isAdmin, canManageHR } = useAuth();
  const navigate = useNavigate();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const notifications = [
    {
      id: 1,
      title: 'Active Payrun Ready',
      time: '10m ago',
      desc: 'Monthly Payroll for current cycle is ready for final validation.',
      icon: <CreditCard className="w-3.5 h-3.5 text-purple-600" />,
      unread: true
    },
    {
      id: 2,
      title: 'Time Off Request Approved',
      time: '1h ago',
      desc: 'Leave request for Aarav Mehta was approved.',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
      unread: false
    },
    {
      id: 3,
      title: 'Daily Attendance Punch',
      time: '3h ago',
      desc: 'Automated biometric sync completed without errors.',
      icon: <Clock className="w-3.5 h-3.5 text-sky-600" />,
      unread: false
    }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.03)] h-16 shrink-0">
        <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          
          {/* Left: Mobile Menu Toggle & Global Search Bar */}
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick Global Search Trigger Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="w-full max-w-sm flex items-center justify-between px-3.5 py-1.5 bg-slate-100/90 hover:bg-slate-200/70 text-slate-500 rounded-xl text-xs transition-all border border-slate-200/80 cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-odoo-purple transition-colors" />
                <span className="font-normal text-slate-500">Quick search or jump...</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">
                <span>⌘</span>
                <span>K</span>
              </div>
            </button>
          </div>

          {/* Right: Quick Punch Widget + Notifications + Profile Dropdown */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            
            {/* Quick Attendance Widget */}
            <QuickAttendanceWidget />

            {/* Notifications Popover */}
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-600 rounded-full ring-2 ring-white animate-pulse" />
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-scaleIn">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Notifications
                    </span>
                    <span className="text-[10px] bg-purple-50 text-odoo-purple font-semibold px-2 py-0.5 rounded-full">
                      1 New
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 text-left hover:bg-slate-50 transition-colors flex items-start gap-2.5 ${
                          n.unread ? 'bg-purple-50/20' : ''
                        }`}
                      >
                        <div className="p-1.5 bg-slate-100 rounded-lg shrink-0 mt-0.5">
                          {n.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                            <span className="text-[10px] text-slate-400">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{n.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-4 py-2 border-t border-slate-100 text-center">
                    <span className="text-[11px] text-slate-400">All notifications updated</span>
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* User Profile Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2.5 p-1 sm:pr-2.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-odoo-purple to-purple-800 text-white font-bold flex items-center justify-center text-xs shadow-xs border border-purple-300/30">
                  {user?.username ? user.username.substring(0, 2).toUpperCase() : 'AD'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 leading-tight">
                    {user?.username || 'User'}
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight">
                    {user?.role || 'Role'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-scaleIn">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{user?.username || 'User'}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email || ''}</p>
                    <div className="mt-2 inline-flex items-center gap-1 bg-purple-50 text-odoo-purple px-2 py-0.5 rounded-md text-[10px] font-bold border border-purple-100">
                      <ShieldCheck className="w-3 h-3" />
                      {user?.role || 'Employee'}
                    </div>
                  </div>

                  <div className="py-1">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          navigate('/users');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        Users & Roles Management
                      </button>
                    )}

                    {canManageHR && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          navigate('/working-schedules');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium cursor-pointer"
                      >
                        <Clock className="w-4 h-4 text-slate-400" />
                        Working Schedules
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate('/audit-logs');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-slate-400" />
                      Audit & Health Center
                    </button>
                  </div>

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-bold cursor-pointer transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </header>

      {/* Global Command Palette Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};
