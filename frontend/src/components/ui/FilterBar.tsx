import React from 'react';
import { Filter, X } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  selectedValue?: string;
  onChange: (value: string) => void;
}

interface FilterBarProps {
  filters: FilterGroup[];
  onResetAll?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onResetAll,
  className = '',
  children
}) => {
  const activeCount = filters.filter((f) => f.selectedValue && f.selectedValue !== 'all' && f.selectedValue !== '').length;

  return (
    <div className={`flex flex-wrap items-center gap-2.5 py-1 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 mr-1">
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        <span>Filters:</span>
      </div>

      {filters.map((filter) => (
        <div key={filter.id} className="relative inline-flex items-center">
          <select
            value={filter.selectedValue || 'all'}
            onChange={(e) => filter.onChange(e.target.value)}
            className={`text-xs font-medium py-1.5 pl-2.5 pr-7 rounded-lg border appearance-none cursor-pointer transition-all bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple ${
              filter.selectedValue && filter.selectedValue !== 'all' && filter.selectedValue !== ''
                ? 'border-odoo-purple/50 text-odoo-purple bg-purple-50/40 font-semibold'
                : 'border-slate-300 text-slate-700 hover:border-slate-400'
            }`}
          >
            <option value="all">{filter.label}: All</option>
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-2 text-slate-400 text-[10px]">▼</div>
        </div>
      ))}

      {children}

      {activeCount > 0 && onResetAll && (
        <button
          type="button"
          onClick={onResetAll}
          className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded-md hover:bg-rose-50 transition-colors ml-auto cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Reset Filters ({activeCount})</span>
        </button>
      )}
    </div>
  );
};
