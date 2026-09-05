import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-[75vh] flex items-center justify-center font-sans p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center relative overflow-hidden">
        {/* Top warning strip */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-500 to-amber-500" />

        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
          403 — Access Denied
        </h1>

        <p className="text-sm text-slate-600 mb-6">
          You do not have the required permissions to access this page or resource.
        </p>

        {user && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-6 text-left text-xs">
            <div className="text-slate-500 uppercase tracking-wider font-semibold text-[10px] mb-1">
              Active Session Details
            </div>
            <div className="font-semibold text-slate-800">{user.username}</div>
            <div className="text-slate-500 truncate">{user.email}</div>
            <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-odoo-purple border border-purple-200">
              Role: {user.role}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 py-2.5 px-4 bg-odoo-purple hover:bg-[#5e3d55] text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={logout}
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Switch Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
