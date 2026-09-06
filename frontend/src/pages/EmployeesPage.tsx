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
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
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
  const urlPage = parseInt(searchParams.get('page') || '1', 10);
  const urlLimit = parseInt(searchParams.get('limit') || '12', 10);
  const urlStatus = (searchParams.get('status') as 'all' | 'active' | 'inactive') || 'all';
  const urlSearch = searchParams.get('search') || '';
  const urlDept = searchParams.get('department') || '';
  const urlSortBy = searchParams.get('sort_by') || 'name';
  const urlSortOrder = (searchParams.get('sort_order') as 'asc' | 'desc') || 'asc';

  // Component state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [options, setOptions] = useState<EmployeeOptions | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination and filter states
  const [page, setPage] = useState<number>(urlPage >= 1 ? urlPage : 1);
  const [pageSize, setPageSize] = useState<number>([12, 24, 48, 100].includes(urlLimit) ? urlLimit : 12);
  const [searchTerm, setSearchTerm] = useState<string>(urlSearch);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(urlStatus);
  const [departmentFilter, setDepartmentFilter] = useState<string>(urlDept);
  const [sortBy, setSortBy] = useState<string>(urlSortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(urlSortOrder);

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

  // Update URL search parameters helper
  const updateUrlParams = useCallback((updates: Record<string, string | null | undefined>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === undefined || val === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, val);
      }
    });
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res: EmployeeListResponse = await employeeService.getEmployees({
        search: searchTerm.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        department: departmentFilter || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        page: page,
        limit: pageSize
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
  }, [searchTerm, statusFilter, departmentFilter, sortBy, sortOrder, page, pageSize]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleViewChange = (view: 'kanban' | 'list') => {
    updateUrlParams({ view });
  };

  const handleSort = (field: string) => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(field);
    setSortOrder(newOrder);
    setPage(1);
    updateUrlParams({ sort_by: field, sort_order: newOrder, page: '1' });
  };

  const handleStatusFilterChange = (status: 'all' | 'active' | 'inactive') => {
    setStatusFilter(status);
    setPage(1);
    updateUrlParams({ status: status === 'all' ? null : status, page: '1' });
  };

  const handleDepartmentFilterChange = (dept: string) => {
    setDepartmentFilter(dept);
    setPage(1);
    updateUrlParams({ department: dept || null, page: '1' });
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setPage(1);
    updateUrlParams({ search: term.trim() || null, page: '1' });
  };

  const handlePageChange = (newPage: number) => {
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const clampedPage = Math.max(1, Math.min(newPage, totalPages));
    setPage(clampedPage);
    updateUrlParams({ page: String(clampedPage) });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    updateUrlParams({ limit: String(newSize), page: '1' });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDepartmentFilter('');
    setPage(1);
    updateUrlParams({ search: null, status: null, department: null, page: '1' });
  };

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all' || departmentFilter !== '';
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  // Generate page numbers to show in pagination bar
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (page > 3) {
        pages.push('...');
      }
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    return pages;
  };

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
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-odoo-purple focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearchChange('')}
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
                onClick={() => handleStatusFilterChange('all')}
                className={`px-3 py-1 rounded-md transition-all ${
                  statusFilter === 'all'
                    ? 'bg-white text-odoo-purple shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({activeCount + inactiveCount})
              </button>
              <button
                onClick={() => handleStatusFilterChange('active')}
                className={`px-3 py-1 rounded-md transition-all ${
                  statusFilter === 'active'
                    ? 'bg-white text-emerald-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                onClick={() => handleStatusFilterChange('inactive')}
                className={`px-3 py-1 rounded-md transition-all ${
                  statusFilter === 'inactive'
                    ? 'bg-white text-slate-800 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Inactive ({inactiveCount})
              </button>
            </div>

            {/* Department Filter */}
            {options && options.departments.length > 0 && (
              <div className="relative">
                <select
                  value={departmentFilter}
                  onChange={(e) => handleDepartmentFilterChange(e.target.value)}
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Showing <strong className="text-slate-800">{employees.length}</strong> of{' '}
            <strong className="text-slate-800">{totalCount}</strong> total employees
            {totalCount > 0 && ` (Page ${page} of ${totalPages})`}
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

      {/* Pagination Footer Controls */}
      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-xs text-slate-600">
          {/* Summary */}
          <div className="flex items-center gap-2 text-slate-600">
            <span>
              Showing <strong className="text-slate-900 font-semibold">{startItem}</strong> to{' '}
              <strong className="text-slate-900 font-semibold">{endItem}</strong> of{' '}
              <strong className="text-slate-900 font-semibold">{totalCount}</strong> employees
            </span>
          </div>

          {/* Page Controls and Page Size */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-odoo-purple cursor-pointer"
              >
                <option value={12}>12 / page</option>
                <option value={24}>24 / page</option>
                <option value={48}>48 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-1">
              {/* First Page */}
              <button
                onClick={() => handlePageChange(1)}
                disabled={page <= 1 || loading}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>

              {/* Previous Page */}
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1 || loading}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Page Number Buttons */}
              <div className="hidden sm:flex items-center gap-1">
                {getPageNumbers().map((p, idx) => (
                  typeof p === 'number' ? (
                    <button
                      key={idx}
                      onClick={() => handlePageChange(p)}
                      disabled={loading}
                      className={`min-w-8 h-8 px-2 rounded-lg text-xs font-semibold transition-all ${
                        p === page
                          ? 'bg-odoo-purple text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ) : (
                    <span key={idx} className="px-1 text-slate-400">
                      {p}
                    </span>
                  )
                ))}
              </div>

              {/* Mobile Current Page Indicator */}
              <span className="sm:hidden px-2 font-medium text-slate-700">
                {page} / {totalPages}
              </span>

              {/* Next Page */}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages || loading}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={page >= totalPages || loading}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Last Page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default EmployeesPage;
