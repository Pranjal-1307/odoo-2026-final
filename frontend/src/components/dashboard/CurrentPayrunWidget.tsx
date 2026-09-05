import React from 'react';
import { 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileCheck, 
  PlusCircle, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { PayrunSummary } from '../../types';

interface CurrentPayrunWidgetProps {
  payrun?: PayrunSummary;
  canManagePayroll: boolean;
}

export const CurrentPayrunWidget: React.FC<CurrentPayrunWidgetProps> = ({
  payrun,
  canManagePayroll,
}) => {
  const navigate = useNavigate();

  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">DRAFT</span>;
      case 'processing':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" /> PROCESSING</span>;
      case 'completed':
      case 'finalized':
      case 'paid':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> FINALIZED</span>;
      case 'failed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> FAILED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-[#714B67] border border-purple-200">{status?.toUpperCase() || 'IDLE'}</span>;
    }
  };

  if (!payrun) {
    return (
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-center py-8">
        <div className="w-12 h-12 rounded-full bg-purple-50 text-[#714B67] flex items-center justify-center mb-3">
          <FileCheck className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No Active Payrun for this Period</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
          Ready to run payroll? Generate dynamic rule computations, validate attendance, and issue payslips.
        </p>
        {canManagePayroll && (
          <button
            onClick={() => navigate('/payroll/payruns/wizard')}
            className="flex items-center gap-2 bg-[#714B67] hover:bg-[#5e3e56] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-md transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Start Payrun Wizard
          </button>
        )}
      </div>
    );
  }

  const isCompleted = payrun.status?.toLowerCase() === 'finalized' || payrun.status?.toLowerCase() === 'paid';

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Payrun</span>
            {getStatusBadge(payrun.status)}
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-1">{payrun.name || 'Monthly Payrun'}</h3>
          <p className="text-xs text-slate-500">{payrun.period || 'Current Cycle'}</p>
        </div>

        <div className="flex items-center gap-2">
          {payrun.id && (
            <button
              onClick={() => navigate(`/payroll/payruns/${payrun.id}`)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <span>View Run Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {canManagePayroll && !isCompleted && (
            <button
              onClick={() => navigate(payrun.id ? `/payroll/payruns/${payrun.id}` : '/payroll/payruns/wizard')}
              className="flex items-center gap-1.5 bg-[#714B67] hover:bg-[#5e3e56] text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Process Payrun</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between items-center text-xs font-bold mb-1.5">
          <span className="text-slate-700">Computation Progress</span>
          <span className="text-[#714B67]">{payrun.progress_percentage}% ({payrun.processed}/{payrun.total_employees} Employees)</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex shadow-inner">
          <div 
            className="bg-emerald-500 h-full transition-all duration-500" 
            style={{ width: `${(payrun.successful / (payrun.total_employees || 1)) * 100}%` }}
            title={`Successful: ${payrun.successful}`}
          />
          <div 
            className="bg-rose-500 h-full transition-all duration-500" 
            style={{ width: `${(payrun.failed / (payrun.total_employees || 1)) * 100}%` }}
            title={`Failed: ${payrun.failed}`}
          />
          <div 
            className="bg-amber-400 h-full transition-all duration-500" 
            style={{ width: `${(payrun.pending / (payrun.total_employees || 1)) * 100}%` }}
            title={`Pending: ${payrun.pending}`}
          />
        </div>
      </div>

      {/* Breakdown Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {/* Completed / Successful */}
        <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100/80">
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Completed</span>
          </div>
          <div className="text-xl font-black text-emerald-800 mt-1">{payrun.successful}</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">Ready for payslips</div>
        </div>

        {/* Pending */}
        <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-100/80">
          <div className="flex items-center gap-1.5 text-xs text-amber-800 font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending</span>
          </div>
          <div className="text-xl font-black text-amber-800 mt-1">{payrun.pending}</div>
          <div className="text-[10px] text-amber-700 mt-0.5">Awaiting batch run</div>
        </div>

        {/* Failed */}
        <div className={`p-3 rounded-lg ${payrun.failed > 0 ? 'bg-rose-50 border-rose-200 ring-1 ring-rose-300' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Exceptions</span>
          </div>
          <div className={`text-xl font-black mt-1 ${payrun.failed > 0 ? 'text-rose-600' : 'text-slate-700'}`}>{payrun.failed}</div>
          <div className="text-[10px] text-rose-600 mt-0.5">
            {payrun.failed > 0 ? 'Requires attention' : 'No errors found'}
          </div>
        </div>

        {/* Excluded / Skipped */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
            <FileCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Excluded</span>
          </div>
          <div className="text-xl font-black text-slate-800 mt-1">{payrun.excluded + payrun.skipped}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Custom filtered</div>
        </div>
      </div>
    </div>
  );
};
