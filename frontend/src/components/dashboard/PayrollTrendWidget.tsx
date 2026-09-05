import React, { useState } from 'react';
import { BarChart3, Info } from 'lucide-react';
import type { PayrollTrendItem } from '../../types';

interface PayrollTrendWidgetProps {
  trendData: PayrollTrendItem[];
  canViewFinancials: boolean;
}

export const PayrollTrendWidget: React.FC<PayrollTrendWidgetProps> = ({
  trendData,
  canViewFinancials,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!canViewFinancials || trendData.length === 0) {
    return null;
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const maxGross = Math.max(...trendData.map((d) => d.gross), 10000);

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#714B67]" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">6-Month Payroll Trend</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Historical Gross vs Net Payroll trends</p>
        </div>

        {/* Legends */}
        <div className="flex items-center gap-3 text-[11px] font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#714B67]" />
            <span className="text-slate-600">Gross</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
            <span className="text-slate-600">Net Paid</span>
          </div>
        </div>
      </div>

      {/* SVG Bar Chart */}
      <div className="relative h-48 w-full mt-2">
        <div className="flex items-end justify-between h-36 gap-2 sm:gap-4 px-2 pt-4">
          {trendData.map((item, idx) => {
            const grossHeight = Math.max(6, (item.gross / maxGross) * 100);
            const netHeight = Math.max(4, (item.net / maxGross) * 100);
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={item.period}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute -top-16 z-20 bg-slate-900 text-white text-[11px] rounded-lg p-2 shadow-xl whitespace-nowrap pointer-events-none transform -translate-y-1 transition-all">
                    <p className="font-bold text-slate-200">{item.month_label}</p>
                    <p className="text-purple-300">Gross: {formatCurrency(item.gross)}</p>
                    <p className="text-emerald-300">Net: {formatCurrency(item.net)}</p>
                    <p className="text-rose-300">Deductions: {formatCurrency(item.deductions)}</p>
                    <p className="text-slate-400">Headcount: {item.employee_count} emps</p>
                  </div>
                )}

                {/* Bars */}
                <div className="w-full max-w-[36px] flex items-end justify-center gap-1 h-full">
                  {/* Gross Bar */}
                  <div
                    style={{ height: `${grossHeight}%` }}
                    className={`w-1/2 rounded-t-sm transition-all duration-300 ${
                      isHovered ? 'bg-purple-800 shadow-md' : 'bg-[#714B67]/80'
                    }`}
                  />
                  {/* Net Bar */}
                  <div
                    style={{ height: `${netHeight}%` }}
                    className={`w-1/2 rounded-t-sm transition-all duration-300 ${
                      isHovered ? 'bg-emerald-600 shadow-md' : 'bg-emerald-500'
                    }`}
                  />
                </div>

                {/* Month Label */}
                <span className={`text-[10px] mt-2 font-medium transition-colors ${
                  isHovered ? 'text-[#714B67] font-bold' : 'text-slate-500'
                }`}>
                  {item.month_label.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1 font-medium">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          Finalized payslip aggregated records
        </span>
        <span className="font-semibold text-slate-700">
          Peak Gross: {formatCurrency(maxGross)}
        </span>
      </div>
    </div>
  );
};
