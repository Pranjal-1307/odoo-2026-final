import React from 'react';
import { 
  Receipt, 
  ChevronRight, 
  AlertTriangle, 
  ArrowUpRight,
  PlusCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { RecentPayrunItem } from '../../types';

interface RecentPayrunsWidgetProps {
  recentPayruns: RecentPayrunItem[];
  canManagePayroll: boolean;
}

export const RecentPayrunsWidget: React.FC<RecentPayrunsWidgetProps> = ({
  recentPayruns,
  canManagePayroll,
}) => {
  const navigate = useNavigate();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">DRAFT</span>;
      case 'processing':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">PROCESSING</span>;
      case 'completed':
      case 'finalized':
      case 'paid':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">FINALIZED</span>;
      case 'failed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">FAILED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-[#714B67]">{status.toUpperCase()}</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#714B67]" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Recent Payroll Runs</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Quick access to recent batches and historical calculations</p>
        </div>

        <button
          onClick={() => navigate('/payroll/payruns')}
          className="text-xs text-[#714B67] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
        >
          View All <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {recentPayruns.length === 0 ? (
        <div className="text-center py-6 text-slate-500">
          <p className="text-xs font-semibold">No payruns created yet.</p>
          {canManagePayroll && (
            <button
              onClick={() => navigate('/payroll/payruns/wizard')}
              className="mt-2 inline-flex items-center gap-1 text-xs text-[#714B67] font-bold hover:underline cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Start First Payrun
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Payrun Name</th>
                <th className="py-2.5 px-3">Period</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Employees</th>
                <th className="py-2.5 px-3">Total Net</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentPayruns.map((pr) => (
                <tr
                  key={pr.id}
                  onClick={() => navigate(`/payroll/payruns/${pr.id}`)}
                  className="hover:bg-purple-50/40 transition-colors cursor-pointer group"
                >
                  <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-2">
                    <span className="truncate">{pr.name}</span>
                    {pr.warning_count > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-100 px-1 rounded font-semibold" title={`${pr.warning_count} Warnings`}>
                        <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                        {pr.warning_count}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{pr.period}</td>
                  <td className="py-2.5 px-3">{getStatusBadge(pr.status)}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-700">{pr.total_employees} Emps</td>
                  <td className="py-2.5 px-3 font-bold text-emerald-700">{formatCurrency(pr.total_net)}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="text-[#714B67] group-hover:translate-x-1 inline-block transition-transform">
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
