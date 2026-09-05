import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  Edit,
  X,
  User as UserIcon,
  Briefcase,
  Building2,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { contractService, ContractFilters, ContractListResponse } from '../services/contractService';
import type { Contract } from '../types';
import { useAuth } from '../context/AuthContext';

export const ContractsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canManageHR, canManagePayroll, user } = useAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [contractsData, setContractsData] = useState<ContractListResponse>({
    items: [],
    total: 0,
    page: 1,
    limit: 15,
    total_pages: 1,
    running_count: 0,
    draft_count: 0,
    expired_count: 0,
    terminated_count: 0,
  });

  // Query parameters
  const employeeIdParam = searchParams.get('employee_id');
  const statusParam = searchParams.get('status') || '';
  const searchParam = searchParams.get('search') || '';
  const departmentParam = searchParams.get('department') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const sortByParam = searchParams.get('sort_by') || 'start_date';
  const sortOrderParam = (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc';

  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [activeStatusTab, setActiveStatusTab] = useState<string>(statusParam);

  // Load contracts
  const fetchContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: ContractFilters = {
        page: pageParam,
        limit: 15,
        sort_by: sortByParam,
        sort_order: sortOrderParam,
      };

      if (searchParam) filters.search = searchParam;
      if (statusParam) filters.status = statusParam;
      if (employeeIdParam) filters.employee_id = parseInt(employeeIdParam, 10);
      if (departmentParam) filters.department = departmentParam;

      const data = await contractService.getContracts(filters);
      setContractsData(data);
    } catch (err: any) {
      console.error('Error fetching contracts:', err);
      setError(err.response?.data?.detail || 'Unable to load contracts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [searchParams]);

  // Handle Search Input submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      newParams.set('search', searchQuery.trim());
    } else {
      newParams.delete('search');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Filter Tab Change
  const handleStatusTabChange = (status: string) => {
    setActiveStatusTab(status);
    const newParams = new URLSearchParams(searchParams);
    if (status) {
      newParams.set('status', status);
    } else {
      newParams.delete('status');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Clear Employee Filter
  const handleClearEmployeeFilter = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('employee_id');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Running
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-500" />
            Draft
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <CheckCircle2 className="w-3 h-3 text-slate-400" />
            Expired
          </span>
        );
      case 'terminated':
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-500" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  // Identify filtered employee name
  const filteredEmployeeName = useMemo(() => {
    if (!employeeIdParam || contractsData.items.length === 0) return null;
    return contractsData.items[0]?.employee_name;
  }, [employeeIdParam, contractsData.items]);

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Contract Management</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage employment agreements, salary terms, schedules, and historical records
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {canManageHR && (
            <button
              onClick={() => navigate('/contracts/new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all duration-150"
            >
              <Plus className="w-4 h-4" />
              New Contract
            </button>
          )}
        </div>
      </div>

      {/* Employee Filter Active Banner */}
      {employeeIdParam && (
        <div className="flex items-center justify-between bg-indigo-50/90 border border-indigo-200 px-4 py-3 rounded-xl text-sm text-indigo-900">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-indigo-600" />
            <span>
              Showing contracts for employee:{' '}
              <strong className="font-semibold text-indigo-950">
                {filteredEmployeeName || `Employee #${employeeIdParam}`}
              </strong>
            </span>
          </div>
          <button
            onClick={handleClearEmployeeFilter}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-white/80 hover:bg-white px-2.5 py-1 rounded-md border border-indigo-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Show All Contracts
          </button>
        </div>
      )}

      {/* Status Filter Tabs & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 rounded-lg text-xs font-medium text-slate-600">
            <button
              onClick={() => handleStatusTabChange('')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeStatusTab === ''
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              All Contracts ({contractsData.total})
            </button>
            <button
              onClick={() => handleStatusTabChange('running')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                activeStatusTab === 'running'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeStatusTab === 'running' ? 'bg-white' : 'bg-emerald-500'}`} />
              Running ({contractsData.running_count})
            </button>
            <button
              onClick={() => handleStatusTabChange('draft')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                activeStatusTab === 'draft'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Draft ({contractsData.draft_count})
            </button>
            <button
              onClick={() => handleStatusTabChange('expired')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeStatusTab === 'expired'
                  ? 'bg-slate-700 text-white font-semibold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Expired ({contractsData.expired_count})
            </button>
            <button
              onClick={() => handleStatusTabChange('terminated')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeStatusTab === 'terminated'
                  ? 'bg-rose-600 text-white font-semibold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Cancelled ({contractsData.terminated_count})
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative min-w-[240px] sm:min-w-[300px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contract, employee, department..."
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('search');
                    setSearchParams(newParams);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Error Loading Contracts</p>
            <p className="text-xs text-rose-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Contract Table List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Contract</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department / Position</th>
                <th className="py-3 px-4">Contract Period</th>
                <th className="py-3 px-4 text-right">Wage / Month</th>
                <th className="py-3 px-4">Salary Structure</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                // Skeletons
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-36" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-32" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-20 ml-auto" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                    <td className="py-4 px-4 text-center"><div className="h-5 bg-slate-200 rounded-full w-16 mx-auto" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-12 ml-auto" /></td>
                  </tr>
                ))
              ) : contractsData.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="p-3 bg-slate-100 rounded-full text-slate-400">
                        <FileText className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-slate-700 text-sm">No contracts found</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {searchParam || statusParam || employeeIdParam
                          ? 'No contracts matched your filter criteria. Try clearing some filters.'
                          : 'No employee contracts have been created yet.'}
                      </p>
                      {(searchParam || statusParam || employeeIdParam) && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setSearchParams({});
                          }}
                          className="mt-2 text-xs text-indigo-600 font-semibold hover:underline"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                contractsData.items.map((contract) => (
                  <tr
                    key={contract.id}
                    onClick={() => navigate(`/contracts/${contract.id}`)}
                    className="hover:bg-indigo-50/40 cursor-pointer transition-colors group"
                  >
                    {/* Contract Identifier */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-indigo-900 group-hover:text-indigo-600 transition-colors">
                          {contract.contract_code}
                        </span>
                        <span className="text-[11px] text-slate-500 truncate max-w-[200px]" title={contract.name}>
                          {contract.name}
                        </span>
                      </div>
                    </td>

                    {/* Employee */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-[11px] shrink-0">
                          {contract.employee_name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 flex items-center gap-1">
                            {contract.employee_name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {contract.employee_code || `EMP#${contract.employee_id}`}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Department & Job Position */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-slate-800 font-medium">{contract.job_position || '—'}</span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-300" />
                          {contract.department || 'General'}
                        </span>
                      </div>
                    </td>

                    {/* Period */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col text-[11px]">
                        <span className="font-medium text-slate-800">
                          {formatDate(contract.start_date)}
                        </span>
                        <span className="text-slate-500">
                          {contract.end_date ? `to ${formatDate(contract.end_date)}` : 'Open-ended (—)'}
                        </span>
                      </div>
                    </td>

                    {/* Wage */}
                    <td className="py-3 px-4 text-right">
                      <span className="font-bold text-slate-900 font-mono">
                        {formatCurrency(contract.wage_per_month)}
                      </span>
                      <span className="block text-[10px] text-slate-400">/ month</span>
                    </td>

                    {/* Salary Structure */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800 truncate max-w-[160px]" title={contract.salary_structure_name || 'Standard'}>
                          {contract.salary_structure_name || 'Standard'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {contract.working_schedule_name || 'Standard Schedule'}
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center">
                      {renderStatusBadge(contract.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/contracts/${contract.id}`)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-md transition-colors border border-transparent hover:border-slate-200"
                          title="View / Edit Contract"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          to={`/employees/${contract.employee_id}`}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-md transition-colors border border-transparent hover:border-slate-200"
                          title="View Employee Profile"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {contractsData.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-t border-slate-200 text-xs text-slate-600">
            <div>
              Showing{' '}
              <strong className="font-semibold text-slate-900">
                {(contractsData.page - 1) * contractsData.limit + 1}
              </strong>{' '}
              to{' '}
              <strong className="font-semibold text-slate-900">
                {Math.min(contractsData.page * contractsData.limit, contractsData.total)}
              </strong>{' '}
              of <strong className="font-semibold text-slate-900">{contractsData.total}</strong> contracts
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={contractsData.page <= 1}
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('page', String(contractsData.page - 1));
                  setSearchParams(newParams);
                }}
                className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium">
                Page {contractsData.page} of {contractsData.total_pages}
              </span>
              <button
                disabled={contractsData.page >= contractsData.total_pages}
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('page', String(contractsData.page + 1));
                  setSearchParams(newParams);
                }}
                className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ContractsPage;
