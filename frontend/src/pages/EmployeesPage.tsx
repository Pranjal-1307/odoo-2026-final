import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  LayoutGrid, 
  List as ListIcon, 
  Filter, 
  X, 
  Users, 
  RefreshCw,
  Building2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { employeeService, type EmployeeListResponse, type EmployeeOptions } from '../services/employeeService';
import { EmployeeKanban } from '../components/employees/EmployeeKanban';
import { EmployeeList } from '../components/employees/EmployeeList';
import { useAuth } from '../context/AuthContext';
import type { Employee } from '../types';

export const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isEmployee, canManageHR } = useAuth();

  // URL state
  const currentView = (searchParams.get('view') as 'kanban' | 'list') || 'kanban';

  // Component state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [options, setOptions] = useState<EmployeeOptions | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // If user is Employee role, they should automatically open their own profile
  useEffect(() => {
    if (isEmployee && user?.employee_id) {
      navigate(`/employees/${user.employee_id}`, { replace: true });
    }
  }, [isEmployee, user, navigate]);

  // Load select options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const opts = await employeeService.getOptions();
        setOptions(opts);
      } catch (err) {
        console.error('Failed to load employee options:', err);
      }
    };
    loadOptions();
  }, []);

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res: EmployeeListResponse = await employeeService.getEmployees({
        search: searchTerm.trim() || undefined,
        status: statusFilter,
        department: departmentFilter || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        limit: 200
      });

      setEmployees(res.items);
      setTotalCount(res.total);
      setActiveCount(res.active_count);
      setInactiveCount(res.inactive_count);
    } catch (err: any) {
      console.error('Failed to load employees:', err);
      setError(err.response?.data?.detail || 'Unable to load employees. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, departmentFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleViewChange = (view: 'kanban' | 'list') => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('view', view);
    setSearchParams(newParams);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDepartmentFilter('');
  };

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all' || departmentFilter !== '';

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-odoo-purple flex items-center justify-center border border-purple-100">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Employees
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Central operational HR hub for organization master data & lifecycle management
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & New Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={fetchEmployees}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Refresh employees"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => handleViewChange('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                currentView === 'kanban'
                  ? 'bg-white text-odoo-purple shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => handleViewChange('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                currentView === 'list'
                  ? 'bg-white text-odoo-purple shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          {/* New Employee Button */}
          {canManageHR && (
            <button
              onClick={() => navigate('/employees/new')}
              className="flex items-center gap-1.5 px-4 py-2 bg-odoo-purple hover:bg-purple-900 text-white rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow"
            >
              <Plus className="w-4 h-4" />
              <span>New</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, code, department or job position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-odoo-purple focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Dropdown Filters & Status Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Pills */}
            <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1 rounded-md transition-all ${
                  statusFilter === 'active'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                onClick={() => setStatusFilter('inactive')}
                className={`px-3 py-1 rounded-md transition-all ${
                  statusFilter === 'inactive'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Inactive ({inactiveCount})
              </button>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-md transition-all ${
                  statusFilter === 'all'
                    ? 'bg-white text-odoo-purple shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({activeCount + inactiveCount})
              </button>
            </div>

            {/* Department Filter */}
            {options && options.departments.length > 0 && (
              <div className="relative">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 pl-3 pr-8 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-odoo-purple cursor-pointer"
                >
                  <option value="">All Departments</option>
                  {options.departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors font-semibold"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Showing <strong className="text-slate-800">{employees.length}</strong> of{' '}
            <strong className="text-slate-800">{totalCount}</strong> employees
          </span>
          {statusFilter === 'inactive' && (
            <span className="text-slate-500 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
              Inactive employees remain historically preserved for payroll & attendance audits
            </span>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Employee Content (Kanban or List) */}
      {currentView === 'kanban' ? (
        <EmployeeKanban employees={employees} loading={loading} />
      ) : (
        <EmployeeList
          employees={employees}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      )}

    </div>
  );
};
export default EmployeesPage;
