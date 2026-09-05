import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Users, 
  FileText, 
  Clock, 
  Calendar, 
  CreditCard, 
  Receipt, 
  Layers, 
  Sliders, 
  ShieldCheck, 
  Settings, 
  LayoutDashboard,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Workforce' | 'Payroll' | 'System';
  path: string;
  icon: React.ReactNode;
  keywords: string[];
  roleAllowed?: boolean;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { isAdmin, canManageHR, canManagePayroll, isEmployee } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const searchItems: SearchItem[] = useMemo(() => {
    const list: SearchItem[] = [
      {
        id: 'dashboard',
        title: 'Executive Dashboard',
        category: 'Navigation',
        path: '/dashboard',
        icon: <LayoutDashboard className="w-4 h-4 text-odoo-purple" />,
        keywords: ['dashboard', 'home', 'kpi', 'metrics', 'overview', 'trends', 'analytics'],
        roleAllowed: true
      },
    {
      id: 'employees',
      title: isEmployee ? 'My Employee Profile' : 'Employees Master Hub',
      category: 'Workforce',
      path: '/employees',
      icon: <Users className="w-4 h-4 text-emerald-600" />,
      keywords: ['employees', 'staff', 'people', 'workers', 'team', 'profile', 'directory'],
      roleAllowed: true
    },
    {
      id: 'contracts',
      title: isEmployee ? 'My Employment Contracts' : 'Contract Management',
      category: 'Workforce',
      path: '/contracts',
      icon: <FileText className="w-4 h-4 text-emerald-600" />,
      keywords: ['contracts', 'wage', 'salary', 'employment terms', 'job agreement'],
      roleAllowed: canManageHR || isEmployee
    },
    {
      id: 'schedules',
      title: 'Working Schedules & Shifts',
      category: 'Workforce',
      path: '/working-schedules',
      icon: <Clock className="w-4 h-4 text-emerald-600" />,
      keywords: ['schedules', 'working hours', 'shifts', 'calendar', 'work patterns'],
      roleAllowed: canManageHR
    },
    {
      id: 'attendance',
      title: 'Attendance & Time Logs',
      category: 'Workforce',
      path: '/attendance',
      icon: <Clock className="w-4 h-4 text-emerald-600" />,
      keywords: ['attendance', 'check in', 'check out', 'punch', 'hours worked', 'timesheet'],
      roleAllowed: true
    },
    {
      id: 'time-off-requests',
      title: 'Time Off / Leave Requests',
      category: 'Workforce',
      path: '/time-off/requests',
      icon: <Calendar className="w-4 h-4 text-emerald-600" />,
      keywords: ['time off', 'leave', 'vacation', 'sick leave', 'holiday', 'pto', 'request'],
      roleAllowed: true
    },
    {
      id: 'time-off-allocations',
      title: 'Leave Allocations',
      category: 'Workforce',
      path: '/time-off/allocations',
      icon: <Calendar className="w-4 h-4 text-emerald-600" />,
      keywords: ['allocations', 'balances', 'accrual', 'leave entitlement'],
      roleAllowed: true
    },
    {
      id: 'time-off-types',
      title: 'Time Off Types Configuration',
      category: 'Workforce',
      path: '/time-off/types',
      icon: <Calendar className="w-4 h-4 text-emerald-600" />,
      keywords: ['leave types', 'paid leave', 'unpaid leave', 'maternity', 'configuration'],
      roleAllowed: canManageHR
    },
    {
      id: 'payruns',
      title: 'Payruns Batch Wizard & Processing',
      category: 'Payroll',
      path: '/payroll/payruns',
      icon: <CreditCard className="w-4 h-4 text-purple-600" />,
      keywords: ['payruns', 'process payroll', 'batch', 'salary processing', 'finalize payrun'],
      roleAllowed: canManagePayroll
    },
    {
      id: 'payslips',
      title: isEmployee ? 'My Payslips & Salary Statements' : 'Payslips Master Records',
      category: 'Payroll',
      path: '/payroll/payslips',
      icon: <Receipt className="w-4 h-4 text-purple-600" />,
      keywords: ['payslips', 'salary slip', 'salary statement', 'net pay', 'gross pay', 'deductions', 'pdf'],
      roleAllowed: true
    },
    {
      id: 'salary-structures',
      title: 'Salary Structures Configuration',
      category: 'Payroll',
      path: '/payroll/salary-structures',
      icon: <Layers className="w-4 h-4 text-purple-600" />,
      keywords: ['structures', 'salary structure', 'components', 'earnings', 'deductions'],
      roleAllowed: canManagePayroll
    },
    {
      id: 'salary-rules',
      title: 'Salary Rules Engine',
      category: 'Payroll',
      path: '/payroll/salary-rules',
      icon: <Sliders className="w-4 h-4 text-purple-600" />,
      keywords: ['salary rules', 'formulas', 'python rules', 'allowances', 'computation order'],
      roleAllowed: canManagePayroll
    },
    {
      id: 'audit-logs',
      title: 'Audit Trail & Cross-Module Health',
      category: 'System',
      path: '/audit-logs',
      icon: <ShieldCheck className="w-4 h-4 text-sky-600" />,
      keywords: ['audit', 'logs', 'health check', 'sync status', 'security', 'integrity'],
      roleAllowed: canManageHR || canManagePayroll || isAdmin
    },
      {
        id: 'users-roles',
        title: 'User Access & RBAC Roles',
        category: 'System',
        path: '/users',
        icon: <Settings className="w-4 h-4 text-sky-600" />,
        keywords: ['users', 'roles', 'permissions', 'admin', 'passwords', 'security'],
        roleAllowed: isAdmin
      }
    ];
    return list.filter((item) => item.roleAllowed !== false);
  }, [isAdmin, canManageHR, canManagePayroll, isEmployee]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return searchItems;
    const lower = query.toLowerCase();
    return searchItems.filter((item) => {
      return (
        item.title.toLowerCase().includes(lower) ||
        item.category.toLowerCase().includes(lower) ||
        item.keywords.some((k) => k.includes(lower))
      );
    });
  }, [searchItems, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // Toggle handled by caller or open if closed
      }
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
      } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
        e.preventDefault();
        navigate(filteredItems[selectedIndex].path);
        onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />
      <div className="flex min-h-full items-start justify-center p-4 sm:p-6 sm:pt-20">
        <div
          className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search bar input */}
          <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50/50">
            <Search className="w-5 h-5 text-odoo-purple shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search PeoplePay360 modules, pages, actions..."
              autoFocus
              className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none"
            />
            <span className="text-[10px] font-bold text-slate-400 bg-slate-200/80 px-2 py-0.5 rounded uppercase tracking-wider">
              ESC
            </span>
          </div>

          {/* Results list */}
          <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100">
            {filteredItems.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                No matching pages or modules found.
              </div>
            ) : (
              filteredItems.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      navigate(item.path);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected ? 'bg-purple-50 text-odoo-purple font-semibold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                        {item.icon}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{item.title}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          {item.category}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span>Jump</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer keyboard guide */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-odoo-purple" />
              PeoplePay360 Fast Navigation
            </span>
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
