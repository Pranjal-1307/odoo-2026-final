import { 
  UserCheck, 
  Clock, 
  Calendar, 
  FileText, 
  Receipt, 
  Download, 
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { EmployeeDashboardData } from '../../types';
import { payslipService } from '../../services/payslipService';

interface EmployeeDashboardViewProps {
  data: EmployeeDashboardData;
}

export const EmployeeDashboardView: React.FC<EmployeeDashboardViewProps> = ({ data }) => {
  const navigate = useNavigate();

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const handleDownloadPdf = async (payslipId: number, payslipNumber: string) => {
    try {
      await payslipService.downloadPdfFile(payslipId, `${payslipNumber}.pdf`);
    } catch (err) {
      console.error('Failed to download payslip PDF:', err);
      alert('Unable to download payslip PDF. It may still be generating.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Employee Greeting Banner */}
      <div className="bg-gradient-to-r from-[#714B67] to-purple-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white font-extrabold text-xl border border-white/20 shadow-inner">
            {data.name ? data.name.substring(0, 2).toUpperCase() : 'ME'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-purple-200 tracking-wider uppercase">Employee Self-Service</span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight mt-0.5">
              Welcome back, {data.name} 👋
            </h1>
            <p className="text-xs text-purple-200 mt-0.5 flex items-center gap-2">
              <span>{data.job_position}</span>
              <span>•</span>
              <span>{data.department}</span>
              <span>•</span>
              <span className="font-mono text-[11px] bg-white/10 px-1.5 py-0.5 rounded">{data.employee_code}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/attendance')}
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-all flex items-center gap-2 cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            <span>Clock In / Out</span>
          </button>
          <button
            onClick={() => navigate('/time-off/requests')}
            className="bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-4 py-2.5 rounded-xl backdrop-blur-sm border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-amber-300" />
            <span>Request Time Off</span>
          </button>
        </div>
      </div>

      {/* Employee Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Leave Balance */}
        <div 
          onClick={() => navigate('/time-off/requests')}
          className="odoo-card p-4.5 cursor-pointer hover:border-amber-300 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Leave Balance</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">
            {data.leave_remaining} Days
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between font-medium">
            <span>{data.leave_used} used of {data.leave_allocations_total}</span>
            {data.pending_leave_requests > 0 && (
              <span className="text-amber-600 font-bold">{data.pending_leave_requests} pending</span>
            )}
          </div>
        </div>

        {/* 2. Attendance Rate */}
        <div 
          onClick={() => navigate('/attendance')}
          className="odoo-card p-4.5 cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            {data.attendance_rate}%
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between font-medium">
            <span>{data.days_present} days present this month</span>
            {data.days_late > 0 && (
              <span className="text-rose-600 font-semibold">{data.days_late} late</span>
            )}
          </div>
        </div>

        {/* 3. Worked Hours This Month */}
        <div 
          onClick={() => navigate('/attendance')}
          className="odoo-card p-4.5 cursor-pointer hover:border-purple-300 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Worked Hours</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-[#714B67] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-900 mt-2">
            {data.total_worked_hours}h
          </div>
          <div className="text-xs text-purple-700 mt-1 font-medium">
            Logged from attendance punches
          </div>
        </div>

        {/* 4. Current Contract Wage */}
        <div 
          onClick={() => navigate('/contracts')}
          className="odoo-card p-4.5 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Contract</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-700 mt-2">
            {data.wage_per_month ? formatCurrency(data.wage_per_month) : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium truncate">
            {data.contract_code || 'Standard Running Contract'}
          </div>
        </div>
      </div>

      {/* My Recent Payslips */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#714B67]" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">My Recent Payslips</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">View breakdown and download verified PDF payslip documents</p>
          </div>

          <button
            onClick={() => navigate('/payroll/payslips')}
            className="text-xs text-[#714B67] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            All Payslips <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {data.recent_payslips.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No payslips generated yet</p>
            <p className="text-[11px] text-slate-400">Your payslips will appear here once payroll is finalized.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Payslip #</th>
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3">Gross Salary</th>
                  <th className="py-2.5 px-3">Deductions</th>
                  <th className="py-2.5 px-3">Net Salary</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recent_payslips.map((ps) => (
                  <tr key={ps.id} className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900 font-mono">
                      {ps.payslip_number}
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {ps.period_label}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {formatCurrency(ps.gross_salary)}
                    </td>
                    <td className="py-3 px-3 text-rose-600 font-medium">
                      -{formatCurrency(ps.total_deductions)}
                    </td>
                    <td className="py-3 px-3 font-extrabold text-emerald-700 text-sm">
                      {formatCurrency(ps.net_salary)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {ps.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={() => navigate(`/payroll/payslips/${ps.id}`)}
                        className="odoo-btn-secondary text-[11px] py-1 px-2.5 cursor-pointer"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDownloadPdf(ps.id, ps.payslip_number)}
                        className="odoo-btn-teal text-[11px] py-1 px-2.5 inline-flex items-center gap-1 cursor-pointer"
                        title="Download PDF Payslip"
                      >
                        <Download className="w-3 h-3" />
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
