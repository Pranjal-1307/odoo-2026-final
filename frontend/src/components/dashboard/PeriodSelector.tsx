import React from 'react';
import { 
  Calendar, 
  Building2, 
  RotateCw, 
  Filter
} from 'lucide-react';

interface PeriodSelectorProps {
  selectedPeriod: string;
  availablePeriods: string[];
  onPeriodChange: (period: string) => void;
  selectedDepartment: string;
  onDepartmentChange: (dept: string) => void;
  departments: string[];
  onRefresh: () => void;
  isLoading: boolean;
  companyName: string;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedPeriod,
  availablePeriods,
  onPeriodChange,
  selectedDepartment,
  onDepartmentChange,
  departments,
  onRefresh,
  isLoading,
  companyName,
}) => {
  const formatPeriodLabel = (p: string) => {
    try {
      const [year, month] = p.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return p;
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
      {/* Company Context */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#714B67] flex items-center justify-center border border-purple-100 shadow-inner">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Company Workspace</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              Live Isolated
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">{companyName || 'PeoplePay360 Inc.'}</h2>
        </div>
      </div>

      {/* Controls: Period, Department, Refresh */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Period Selector */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus-within:border-[#714B67] focus-within:ring-1 focus-within:ring-[#714B67] transition-all">
          <Calendar className="w-4 h-4 text-[#714B67]" />
          <label htmlFor="period-select" className="text-xs text-slate-500 font-medium">Period:</label>
          <select
            id="period-select"
            value={selectedPeriod}
            onChange={(e) => onPeriodChange(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
          >
            {availablePeriods.map((p) => (
              <option key={p} value={p}>
                {formatPeriodLabel(p)} ({p})
              </option>
            ))}
          </select>
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus-within:border-[#714B67] focus-within:ring-1 focus-within:ring-[#714B67] transition-all">
          <Filter className="w-4 h-4 text-slate-400" />
          <label htmlFor="dept-select" className="text-xs text-slate-500 font-medium">Department:</label>
          <select
            id="dept-select"
            value={selectedDepartment}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh dashboard metrics"
          className="flex items-center gap-1.5 bg-[#714B67] hover:bg-[#5e3e56] text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
};
