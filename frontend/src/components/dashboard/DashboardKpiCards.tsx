import React from 'react';
import { 
  Users, 
  FileText, 
  CreditCard, 
  Receipt, 
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { 
  EmployeeKpiSummary, 
  ContractKpiSummary, 
  PayrollFinancialSummary 
} from '../../types';

interface DashboardKpiCardsProps {
  employees: EmployeeKpiSummary;
  contracts: ContractKpiSummary;
  payroll: PayrollFinancialSummary;
  canViewFinancials: boolean;
}

export const DashboardKpiCards: React.FC<DashboardKpiCardsProps> = ({
  employees,
  contracts,
  payroll,
  canViewFinancials,
}) => {
  const navigate = useNavigate();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Employees */}
      <div 
        onClick={() => navigate('/employees')}
        className="odoo-card p-4.5 cursor-pointer hover:border-purple-300 hover:shadow-md transition-all group"
      >
        <div className="flex justify-between items-start">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Employees</span>
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-[#714B67] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-slate-900 mt-2">
          {employees.total}
        </div>
        <div className="text-xs text-slate-600 mt-1 flex items-center justify-between font-medium">
          <span className="text-emerald-700 font-semibold">{employees.active} Active</span>
          {employees.on_leave > 0 && (
            <span className="text-amber-700">{employees.on_leave} On Leave</span>
          )}
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#714B67] transition-colors" />
        </div>
      </div>

      {/* 2. Active Contracts */}
      <div 
        onClick={() => navigate('/contracts')}
        className="odoo-card p-4.5 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group"
      >
        <div className="flex justify-between items-start">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Contracts</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-indigo-700 mt-2">
          {contracts.active}
        </div>
        <div className="text-xs text-slate-600 mt-1 flex items-center justify-between font-medium">
          {contracts.expiring_soon > 0 ? (
            <span className="text-amber-600 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              {contracts.expiring_soon} expiring &lt;30d
            </span>
          ) : (
            <span className="text-slate-500">{contracts.total} total filed</span>
          )}
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
        </div>
      </div>

      {/* 3. Gross Payroll */}
      {canViewFinancials ? (
        <div 
          onClick={() => navigate('/payroll/payslips')}
          className="odoo-card p-4.5 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Payroll</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatCurrency(payroll.gross_payroll)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between font-medium">
            <span>{payroll.payslips_count} payslips processed</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </div>
      ) : (
        <div className="odoo-card p-4.5 bg-slate-50/70 border-dashed border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Payroll</span>
          <div className="text-sm font-semibold text-slate-400 mt-3">Restricted by Role</div>
          <div className="text-[11px] text-slate-400 mt-1">Authorized Payroll Roles only</div>
        </div>
      )}

      {/* 4. Net Payroll */}
      {canViewFinancials ? (
        <div 
          onClick={() => navigate('/payroll/payruns')}
          className="odoo-card p-4.5 cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all group bg-gradient-to-br from-emerald-50/30 to-white"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Net Payroll Paid</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {formatCurrency(payroll.net_payroll)}
          </div>
          <div className="text-xs text-slate-600 mt-1 flex items-center justify-between font-medium">
            <span className="text-rose-600">Deductions: {formatCurrency(payroll.total_deductions)}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 transition-colors" />
          </div>
        </div>
      ) : (
        <div className="odoo-card p-4.5 bg-slate-50/70 border-dashed border-slate-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Payroll</span>
          <div className="text-sm font-semibold text-slate-400 mt-3">Restricted by Role</div>
          <div className="text-[11px] text-slate-400 mt-1">Requires payroll view permission</div>
        </div>
      )}
    </div>
  );
};
