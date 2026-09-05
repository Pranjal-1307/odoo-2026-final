import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, Building2, UserCheck, ShieldAlert } from 'lucide-react';
import type { Employee } from '../../types';

interface EmployeeKanbanProps {
  employees: Employee[];
  loading?: boolean;
}

const getInitials = (name: string) => {
  if (!name) return 'EM';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarBgColor = (name: string) => {
  const colors = [
    'from-purple-500 to-indigo-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-violet-500 to-purple-600'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export const EmployeeKanban: React.FC<EmployeeKanbanProps> = ({ employees, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-slate-200" />
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="h-3 bg-slate-100 rounded w-4/5" />
              <div className="h-3 bg-slate-100 rounded w-3/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-purple-50 text-odoo-purple flex items-center justify-center mx-auto mb-3">
          <UserCheck className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">No employees found</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          No employee records match your search criteria or active filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {employees.map((emp) => {
        const isInactive = emp.status === 'inactive' || emp.status === 'terminated';
        const bgGradient = getAvatarBgColor(emp.name);
        const initials = getInitials(emp.name);

        return (
          <div
            key={emp.id}
            onClick={() => navigate(`/employees/${emp.id}`)}
            className={`group relative bg-white rounded-xl border transition-all duration-200 p-5 cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-md hover:-translate-y-0.5 ${
              isInactive 
                ? 'border-slate-200 bg-slate-50/50 opacity-85 hover:opacity-100' 
                : 'border-slate-200 hover:border-purple-300'
            }`}
          >
            {/* Header: Avatar, Name, Code, Status */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-3.5">
                <div className="flex items-center gap-3">
                  {emp.avatar_url ? (
                    <img
                      src={emp.avatar_url}
                      alt={emp.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs"
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${bgGradient} text-white font-bold flex items-center justify-center text-sm shadow-xs border-2 border-white`}>
                      {initials}
                    </div>
                  )}

                  <div className="flex flex-col">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-odoo-purple transition-colors line-clamp-1">
                      {emp.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {emp.employee_code}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Pill */}
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                    emp.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : emp.status === 'on_leave'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {emp.status}
                </span>
              </div>

              {/* Job & Department info */}
              <div className="mb-3">
                <p className="text-sm font-semibold text-slate-800 line-clamp-1">
                  {emp.job_position}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{emp.department}</span>
                </div>
              </div>
            </div>

            {/* Footer / Contact Details */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2 truncate">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate text-slate-600">{emp.work_email}</span>
              </div>
              {emp.phone && (
                <div className="flex items-center gap-2 truncate">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate text-slate-600">{emp.phone}</span>
                </div>
              )}
              {emp.manager_name && (
                <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                  <span className="font-medium text-slate-400">Manager:</span>
                  <span className="font-semibold text-slate-700 truncate">{emp.manager_name}</span>
                </div>
              )}
            </div>

            {isInactive && (
              <div className="mt-2.5 bg-slate-100 text-slate-500 px-2 py-1 rounded text-[11px] flex items-center justify-center gap-1">
                <ShieldAlert className="w-3 h-3 text-slate-400" />
                <span>Historical records preserved</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
