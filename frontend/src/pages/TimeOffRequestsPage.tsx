import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Calendar,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Filter,
  User as UserIcon,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Ban
} from 'lucide-react';
import { timeOffService } from '../services/timeOffService';
import type { TimeOffRequest, TimeOffType, TimeOffOverview } from '../types';
import { useAuth } from '../context/AuthContext';

export const TimeOffRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, canManageHR } = useAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [types, setTypes] = useState<TimeOffType[]>([]);
  const [overview, setOverview] = useState<TimeOffOverview | null>(null);

  // Filters from URL
  const statusParam = searchParams.get('status') || '';
  const myRequestsParam = searchParams.get('my_requests') === 'true';
  const typeIdParam = searchParams.get('type_id') || '';
  const searchParam = searchParams.get('search') || '';

  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [activeTab, setActiveTab] = useState<string>(
    myRequestsParam ? 'my' : statusParam ? statusParam : 'all'
  );

  // Modal states for Quick Approve/Refuse
  const [approveModalReq, setApproveModalReq] = useState<TimeOffRequest | null>(null);
  const [refuseModalReq, setRefuseModalReq] = useState<TimeOffRequest | null>(null);
  const [refusalReason, setRefusalReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [reqsData, typesData, overviewData] = await Promise.all([
        timeOffService.getRequests({
          status_filter: statusParam || undefined,
          my_requests_only: myRequestsParam || (user?.role === 'Employee'),
          type_id: typeIdParam ? parseInt(typeIdParam, 10) : undefined,
          search: searchParam || undefined
        }),
        timeOffService.getTypes(),
        timeOffService.getOverview()
      ]);

      setRequests(reqsData);
      setTypes(typesData);
      setOverview(overviewData);
    } catch (err: any) {
      console.error('Error fetching time off requests:', err);
      setError(err.response?.data?.detail || 'Failed to load time off requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchParams]);

  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
    const newParams = new URLSearchParams(searchParams);
    if (tabKey === 'all') {
      newParams.delete('status');
      newParams.delete('my_requests');
    } else if (tabKey === 'my') {
      newParams.delete('status');
      newParams.set('my_requests', 'true');
    } else {
      newParams.set('status', tabKey);
      newParams.delete('my_requests');
    }
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      newParams.set('search', searchQuery.trim());
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  const handleTypeFilter = (typeId: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (typeId) {
      newParams.set('type_id', typeId);
    } else {
      newParams.delete('type_id');
    }
    setSearchParams(newParams);
  };

  const handleConfirmApprove = async () => {
    if (!approveModalReq) return;
    try {
      setActionLoading(true);
      await timeOffService.approveRequest(approveModalReq.id);
      setApproveModalReq(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Approval failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmRefuse = async () => {
    if (!refuseModalReq) return;
    try {
      setActionLoading(true);
      await timeOffService.refuseRequest(refuseModalReq.id, refusalReason);
      setRefuseModalReq(null);
      setRefusalReason('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Refusal failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved
          </span>
        );
      case 'to_approve':
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            To Approve
          </span>
        );
      case 'refused':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Refused
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <Ban className="w-3.5 h-3.5 text-slate-500" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-odoo-purple" />
            Time Off Requests
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage employee leaves, allocation usage, and approval workflows.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/time-off/requests/new"
            className="inline-flex items-center gap-2 bg-odoo-purple hover:bg-purple-900 text-white px-4 py-2 rounded-lg text-sm font-medium shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Time Off Request
          </Link>
        </div>
      </div>

      {/* KPI Overview Cards */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{overview.pending_requests_count}</div>
              <div className="text-xs font-medium text-slate-500">Pending Approvals</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{overview.approved_requests_count}</div>
              <div className="text-xs font-medium text-slate-500">Approved Requests</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-purple-50 rounded-lg text-odoo-purple">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{overview.upcoming_leaves_count}</div>
              <div className="text-xs font-medium text-slate-500">Upcoming Leaves</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{overview.my_remaining_days} <span className="text-xs font-normal text-slate-500">Days</span></div>
              <div className="text-xs font-medium text-slate-500">My Remaining Balance</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-4 pt-2 overflow-x-auto gap-2">
          <button
            onClick={() => handleTabChange('all')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'all'
                ? 'border-odoo-purple text-odoo-purple font-semibold bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            All Requests
          </button>

          <button
            onClick={() => handleTabChange('my')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'my'
                ? 'border-odoo-purple text-odoo-purple font-semibold bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            My Requests
          </button>

          <button
            onClick={() => handleTabChange('pending')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'pending'
                ? 'border-odoo-purple text-odoo-purple font-semibold bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            To Approve
          </button>

          <button
            onClick={() => handleTabChange('approved')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'approved'
                ? 'border-odoo-purple text-odoo-purple font-semibold bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Approved
          </button>

          <button
            onClick={() => handleTabChange('refused')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'refused'
                ? 'border-odoo-purple text-odoo-purple font-semibold bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Refused
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/30 flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-odoo-purple focus:border-transparent bg-white shadow-sm"
            />
          </form>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={typeIdParam}
                onChange={(e) => handleTypeFilter(e.target.value)}
                className="text-sm rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-odoo-purple shadow-sm"
              >
                <option value="">All Leave Types</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setSearchQuery('');
                setSearchParams({});
              }}
              title="Reset Filters"
              className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 m-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Requests Table */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-odoo-purple" />
            <span>Loading time off requests...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-base font-medium text-slate-600">No time off requests found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or create a new request.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Approver</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => {
                  const isPending = r.status === 'to_approve' || r.status === 'pending';
                  const isOwner = user?.employee_id === r.employee_id;
                  const canApprove = canManageHR && !isOwner && isPending;

                  return (
                    <tr
                      key={r.id}
                      onClick={() => navigate(`/time-off/requests/${r.id}`)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Employee */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-odoo-purple font-semibold flex items-center justify-center text-xs flex-shrink-0">
                            {r.employee_name ? r.employee_name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800 group-hover:text-odoo-purple transition-colors">
                              {r.employee_name}
                            </div>
                            <div className="text-xs text-slate-400">
                              {r.employee_code || r.department || 'Employee'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-4">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium"
                          style={{
                            backgroundColor: `${r.time_off_type_color || '#017E84'}15`,
                            color: r.time_off_type_color || '#017E84',
                            border: `1px solid ${r.time_off_type_color || '#017E84'}30`
                          }}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: r.time_off_type_color || '#017E84' }}
                          />
                          {r.time_off_type_name}
                        </span>
                      </td>

                      {/* Period */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 text-xs">
                        <div className="font-medium text-slate-700">{r.start_date}</div>
                        <div className="text-slate-400">to {r.end_date}</div>
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">{r.duration}</span>{' '}
                        <span className="text-xs text-slate-500 capitalize">{r.unit || 'Days'}</span>
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-500 text-xs" title={r.reason || ''}>
                        {r.reason || '—'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(r.status)}
                      </td>

                      {/* Approver */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                        {r.approver_name || '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {canApprove && (
                            <>
                              <button
                                onClick={() => setApproveModalReq(r)}
                                title="Approve Request"
                                className="px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setRefuseModalReq(r)}
                                title="Refuse Request"
                                className="px-2.5 py-1 text-xs font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
                              >
                                Refuse
                              </button>
                            </>
                          )}
                          <Link
                            to={`/time-off/requests/${r.id}`}
                            className="p-1 text-slate-400 hover:text-odoo-purple transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal: Approve Request */}
      {approveModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Approve Time Off Request?</h3>
                <p className="text-xs text-slate-500">This will officially consume the employee's allocation balance.</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3.5 text-sm space-y-2 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Employee:</span>
                <span className="font-semibold text-slate-800">{approveModalReq.employee_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Type:</span>
                <span className="font-semibold text-slate-800">{approveModalReq.time_off_type_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Duration:</span>
                <span className="font-bold text-odoo-purple">{approveModalReq.duration} {approveModalReq.unit || 'Days'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Period:</span>
                <span className="text-slate-700">{approveModalReq.start_date} to {approveModalReq.end_date}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setApproveModalReq(null)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow transition-colors flex items-center gap-1.5"
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Refuse Request */}
      {refuseModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-lg">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Refuse Time Off Request?</h3>
                <p className="text-xs text-slate-500">The request will be marked as refused. No balance will be consumed.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Refusal Reason (Optional)
              </label>
              <textarea
                value={refusalReason}
                onChange={(e) => setRefusalReason(e.target.value)}
                placeholder="e.g., Insufficient staffing during requested period."
                rows={3}
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRefuseModalReq(null)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRefuse}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow transition-colors flex items-center gap-1.5"
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Confirm Refusal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeOffRequestsPage;
