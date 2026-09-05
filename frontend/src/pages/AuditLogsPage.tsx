import React, { useState, useEffect } from 'react';
import {
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  RefreshCw,
  Clock,
  ChevronRight,
  Database,
  Building,
  Layers,
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import { auditService } from '../services/auditService';
import type { AuditLogItem, IntegrationHealthResponse } from '../services/auditService';

export const AuditLogsPage: React.FC = () => {

  const [activeTab, setActiveTab] = useState<'audit' | 'health'>('audit');

  // Audit Logs State
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [availableEntities, setAvailableEntities] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedEntity, setSelectedEntity] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Selected Log Drawer / Modal for JSON Inspection
  const [inspectedLog, setInspectedLog] = useState<AuditLogItem | null>(null);

  // Health Check State
  const [healthData, setHealthData] = useState<IntegrationHealthResponse | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await auditService.getAuditLogs({
        search: search.trim() || undefined,
        action: selectedAction !== 'all' ? selectedAction : undefined,
        entity_type: selectedEntity !== 'all' ? selectedEntity : undefined,
        skip: (page - 1) * limit,
        limit,
      });
      setLogs(res.items);
      setTotalLogs(res.total);
      if (res.actions?.length) setAvailableActions(res.actions);
      if (res.entity_types?.length) setAvailableEntities(res.entity_types);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Fetch Integration Health
  const fetchHealth = async () => {
    setLoadingHealth(true);
    try {
      const data = await auditService.getIntegrationHealth('PeoplePay360 Inc.');
      setHealthData(data);
    } catch (err) {
      console.error('Failed to run integration health check:', err);
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    } else {
      fetchHealth();
    }
  }, [activeTab, page, selectedAction, selectedEntity]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAuditLogs();
  };

  // Action badge color mapping
  const getActionBadgeClass = (action: string) => {
    if (action.includes('CREATED') || action.includes('APPROVED')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('FINALIZED') || action.includes('ACTIVATED')) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    if (action.includes('UPDATED') || action.includes('STATUS')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (action.includes('REFUSED') || action.includes('CANCELLED') || action.includes('FAILED')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/10 text-indigo-600 rounded-xl">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Integration & Audit Center
              </h1>
              <p className="text-sm text-slate-500">
                Immutable system event logging, cross-module business rules & integrity monitoring
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'audit'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            Audit Trail
            {totalLogs > 0 && (
              <span className="ml-1.5 px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full font-medium">
                {totalLogs}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'health'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Cross-Module Health
            {healthData && healthData.issues.length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full font-medium">
                {healthData.issues.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Logged Events
            </div>
            <div className="text-2xl font-bold text-slate-900">{totalLogs}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              System Health
            </div>
            <div className="text-2xl font-bold text-emerald-600">
              {healthData?.status ? healthData.status.toUpperCase() : 'OPTIMAL'}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Authoritative Modules
            </div>
            <div className="text-2xl font-bold text-slate-900">8 Modules</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Company Scope
            </div>
            <div className="text-sm font-bold text-slate-900 truncate">PeoplePay360 Inc.</div>
          </div>
        </div>
      </div>

      {/* TAB 1: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Filters Bar */}
          <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search audit trail by actor, code, details..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </form>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedAction}
                  onChange={(e) => {
                    setSelectedAction(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Actions</option>
                  {availableActions.map((act) => (
                    <option key={act} value={act}>
                      {act}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedEntity}
                  onChange={(e) => {
                    setSelectedEntity(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Entities</option>
                  {availableEntities.map((ent) => (
                    <option key={ent} value={ent}>
                      {ent.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => fetchAuditLogs()}
                disabled={loadingLogs}
                className="p-2 text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                title="Refresh Audit Logs"
              >
                <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6">Actor</th>
                  <th className="py-3.5 px-6">Action</th>
                  <th className="py-3.5 px-6">Entity</th>
                  <th className="py-3.5 px-6">Target Record</th>
                  <th className="py-3.5 px-6">Details</th>
                  <th className="py-3.5 px-6 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {loadingLogs ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                      Loading audit events...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      <Shield className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                      No audit events found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      onClick={() => setInspectedLog(log)}
                    >
                      <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 font-medium text-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                            {log.actor_name ? log.actor_name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <span>{log.actor_name || 'System'}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${getActionBadgeClass(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="py-4 px-6 font-mono text-xs text-slate-600 uppercase">
                        {log.entity_type}
                      </td>

                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {log.entity_code || (log.entity_id ? `#${log.entity_id}` : '—')}
                      </td>

                      <td className="py-4 px-6 text-slate-600 max-w-xs truncate">
                        {log.details || '—'}
                      </td>

                      <td className="py-4 px-6 text-right">
                        {(log.old_value || log.new_value) && (
                          <span className="text-xs font-semibold text-indigo-600 group-hover:underline flex items-center justify-end gap-1">
                            View Diff <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalLogs > limit && (
            <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-sm text-slate-600">
              <div>
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalLogs)} of{' '}
                {totalLogs} events
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"
                >
                  Previous
                </button>
                <span className="font-semibold px-2">Page {page}</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * limit >= totalLogs}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CROSS-MODULE INTEGRATION HEALTH */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                System Consistency & Rules Diagnostic
              </h2>
              <p className="text-sm text-slate-500">
                Live automated validation across Employee, Contract, Schedule, Attendance, Time
                Off, and Payroll engines.
              </p>
            </div>
            <button
              onClick={() => fetchHealth()}
              disabled={loadingHealth}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loadingHealth ? 'animate-spin' : ''}`} />
              Run Health Check
            </button>
          </div>

          {loadingHealth ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-500" />
              Scanning cross-module relationships and historical constraints...
            </div>
          ) : healthData ? (
            <div className="space-y-4">
              {/* Status Banner */}
              <div
                className={`p-6 rounded-2xl border flex items-center justify-between ${
                  healthData.status === 'healthy'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : healthData.status === 'warnings'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-4">
                  {healthData.status === 'healthy' ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  ) : healthData.status === 'warnings' ? (
                    <AlertTriangle className="w-8 h-8 text-amber-600" />
                  ) : (
                    <XCircle className="w-8 h-8 text-rose-600" />
                  )}
                  <div>
                    <h3 className="text-lg font-bold">
                      {healthData.status === 'healthy'
                        ? 'System Integrity Clean & Compliant'
                        : `${healthData.issues.length} Consistency Issue(s) Detected`}
                    </h3>
                    <p className="text-sm opacity-90">
                      Evaluated {healthData.total_checks} cross-module checks across{' '}
                      {healthData.summary.active_employees} active employees and{' '}
                      {healthData.summary.active_payruns} payruns.
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-semibold uppercase opacity-75">Checked At</div>
                  <div className="text-sm font-semibold">
                    {new Date(healthData.checked_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Issues List */}
              {healthData.issues.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-slate-800">
                    All Cross-Module Rules Satisfied
                  </h4>
                  <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                    Contracts, schedules, attendance records, time off approvals, and payrun
                    snapshots are consistent and protected.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {healthData.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              issue.severity === 'blocking_error'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {issue.severity.toUpperCase()}
                          </span>
                          <span className="font-mono text-xs text-slate-400">{issue.code}</span>
                          <span className="font-bold text-slate-900">{issue.title}</span>
                        </div>
                        <p className="text-sm text-slate-600">{issue.message}</p>
                        <div className="text-xs text-indigo-600 font-semibold flex items-center gap-1.5 pt-1">
                          <Info className="w-3.5 h-3.5" />
                          <span>Recommendation: {issue.suggested_action}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* JSON Payload Inspection Modal */}
      {inspectedLog && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">
                  Audit Event #{inspectedLog.id} — {inspectedLog.action}
                </h3>
              </div>
              <button
                onClick={() => setInspectedLog(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-sm">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <div className="text-xs text-slate-500 font-semibold">Actor</div>
                  <div className="font-semibold text-slate-800">
                    {inspectedLog.actor_name || 'System'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold">Entity Target</div>
                  <div className="font-semibold text-slate-800">
                    {inspectedLog.entity_type.toUpperCase()}{' '}
                    {inspectedLog.entity_code ? `(${inspectedLog.entity_code})` : ''}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold">Timestamp</div>
                  <div className="text-slate-700">
                    {new Date(inspectedLog.created_at).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold">Details</div>
                  <div className="text-slate-700">{inspectedLog.details || '—'}</div>
                </div>
              </div>

              {/* Old vs New Values */}
              <div className="space-y-2">
                <div className="font-semibold text-slate-800">Event Payload State:</div>
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto">
                  {JSON.stringify(
                    {
                      old_value: inspectedLog.old_value,
                      new_value: inspectedLog.new_value,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setInspectedLog(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
