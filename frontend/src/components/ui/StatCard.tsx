import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number | string;
    isPositive?: boolean;
    isNeutral?: boolean;
    label?: string;
  };
  subtitle?: string;
  accentColor?: 'purple' | 'teal' | 'emerald' | 'amber' | 'rose' | 'sky' | 'indigo';
  onClick?: () => void;
  className?: string;
}

const colorMap = {
  purple: {
    iconBg: 'bg-purple-50 text-odoo-purple border-purple-100',
    hoverBorder: 'hover:border-purple-300'
  },
  teal: {
    iconBg: 'bg-teal-50 text-odoo-teal border-teal-100',
    hoverBorder: 'hover:border-teal-300'
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    hoverBorder: 'hover:border-emerald-300'
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
    hoverBorder: 'hover:border-amber-300'
  },
  rose: {
    iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
    hoverBorder: 'hover:border-rose-300'
  },
  sky: {
    iconBg: 'bg-sky-50 text-sky-600 border-sky-100',
    hoverBorder: 'hover:border-sky-300'
  },
  indigo: {
    iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    hoverBorder: 'hover:border-indigo-300'
  }
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  subtitle,
  accentColor = 'purple',
  onClick,
  className = ''
}) => {
  const scheme = colorMap[accentColor] || colorMap.purple;

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200/90 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-200 ${
        onClick ? 'cursor-pointer' : ''
      } ${scheme.hoverBorder} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-xs ${scheme.iconBg}`}>
            {icon}
          </div>
        )}
      </div>

      {(trend || subtitle) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={`inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded-md ${
                trend.isNeutral
                  ? 'bg-slate-100 text-slate-600'
                  : trend.isPositive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {trend.isNeutral ? (
                <Minus className="w-3 h-3" />
              ) : trend.isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{trend.value}</span>
            </span>
          )}
          {trend?.label && <span className="text-slate-500">{trend.label}</span>}
          {!trend && subtitle && <span className="text-slate-500">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
