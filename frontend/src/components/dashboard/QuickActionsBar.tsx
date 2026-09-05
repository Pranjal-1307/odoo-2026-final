import React from 'react';
import { 
  UserPlus, 
  FilePlus, 
  PlayCircle, 
  Receipt, 
  Clock, 
  Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickActionsBarProps {
  canManageHR: boolean;
  canManagePayroll: boolean;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  canManageHR,
  canManagePayroll,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-4 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-emerald-400 border border-white/10">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold tracking-tight text-white">Operations Quick Launch</h3>
          <p className="text-xs text-slate-300">Fast workflows and operational management</p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {canManagePayroll && (
          <button
            onClick={() => navigate('/payroll/payruns/wizard')}
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Start Payrun</span>
          </button>
        )}

        {canManageHR && (
          <>
            <button
              onClick={() => navigate('/employees/new')}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-purple-300" />
              <span>Add Employee</span>
            </button>

            <button
              onClick={() => navigate('/contracts/new')}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FilePlus className="w-3.5 h-3.5 text-indigo-300" />
              <span>Create Contract</span>
            </button>
          </>
        )}

        <button
          onClick={() => navigate('/attendance')}
          className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Clock className="w-3.5 h-3.5 text-amber-300" />
          <span>Attendance</span>
        </button>

        <button
          onClick={() => navigate('/payroll/payslips')}
          className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Receipt className="w-3.5 h-3.5 text-blue-300" />
          <span>Payslips</span>
        </button>
      </div>
    </div>
  );
};
