import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  X, 
  Edit3, 
  User, 
  Briefcase, 
  CreditCard, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle,
  PowerOff,
  RefreshCw
} from 'lucide-react';
import { employeeService, type EmployeeOptions } from '../services/employeeService';
import { EmployeeSmartButtons } from '../components/employees/EmployeeSmartButtons';
import { useAuth } from '../context/AuthContext';
import type { Employee } from '../types';

export const EmployeeFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canManageHR } = useAuth();

  const isNew = !id || id === 'new';
  const employeeId = isNew ? null : parseInt(id, 10);

  // States
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [options, setOptions] = useState<EmployeeOptions | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(isNew);
  const [loading, setLoading] = useState<boolean>(!isNew);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Deactivation confirmation modal state
  const [showDeactivateModal, setShowDeactivateModal] = useState<boolean>(false);
  const [statusUpdating, setStatusUpdating] = useState<boolean>(false);

  // Form Fields State
  const [formData, setFormData] = useState({
    name: '',
    employee_code: '',
    work_email: '',
    phone: '',
    department: 'Engineering',
    job_position: '',
    manager_id: 0,
    working_schedule_id: 0,
    company: 'PeoplePay360 Inc.',
    work_location: 'Headquarters',
    employee_type: 'Full-Time',
    status: 'active' as 'active' | 'inactive' | 'on_leave' | 'terminated',
    avatar_url: '',
    bank_name: '',
    bank_account_no: '',
    ifsc_code: '',
    pan_no: ''
  });

  const [formDirty, setFormDirty] = useState(false);

  // 1. Fetch select options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const opts = await employeeService.getOptions();
        setOptions(opts);
        if (isNew && opts.working_schedules.length > 0) {
          setFormData((prev) => ({
            ...prev,
            working_schedule_id: opts.working_schedules[0].id
          }));
        }
      } catch (err) {
        console.error('Failed to load employee options:', err);
      }
    };
    loadOptions();
  }, [isNew]);

  // 2. Fetch Employee details
  useEffect(() => {
    if (isNew) {
      setIsEditing(true);
      setLoading(false);
      return;
    }

    const loadEmployee = async () => {
      try {
        setLoading(true);
        setError(null);
        const emp = await employeeService.getEmployee(employeeId!);
        setEmployee(emp);
        setFormData({
          name: emp.name || '',
          employee_code: emp.employee_code || '',
          work_email: emp.work_email || '',
          phone: emp.phone || '',
          department: emp.department || 'Engineering',
          job_position: emp.job_position || '',
          manager_id: emp.manager_id || 0,
          working_schedule_id: emp.working_schedule_id || 0,
          company: emp.company || 'PeoplePay360 Inc.',
          work_location: emp.work_location || 'Headquarters',
          employee_type: emp.employee_type || 'Full-Time',
          status: emp.status || 'active',
          avatar_url: emp.avatar_url || '',
          bank_name: emp.bank_name || '',
          bank_account_no: emp.bank_account_no || '',
          ifsc_code: emp.ifsc_code || '',
          pan_no: emp.pan_no || ''
        });
        setIsEditing(false);
      } catch (err: any) {
        console.error('Failed to load employee:', err);
        setError(err.response?.data?.detail || 'Employee not found or access denied.');
      } finally {
        setLoading(false);
      }
    };

    loadEmployee();
  }, [employeeId, isNew]);

  // Warn on leaving if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (formDirty && isEditing) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formDirty, isEditing]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormDirty(true);
  };

  const handleCancelEdit = () => {
    if (isNew) {
      navigate('/employees');
      return;
    }
    if (employee) {
      setFormData({
        name: employee.name || '',
        employee_code: employee.employee_code || '',
        work_email: employee.work_email || '',
        phone: employee.phone || '',
        department: employee.department || 'Engineering',
        job_position: employee.job_position || '',
        manager_id: employee.manager_id || 0,
        working_schedule_id: employee.working_schedule_id || 0,
        company: employee.company || 'PeoplePay360 Inc.',
        work_location: employee.work_location || 'Headquarters',
        employee_type: employee.employee_type || 'Full-Time',
        status: employee.status || 'active',
        avatar_url: employee.avatar_url || '',
        bank_name: employee.bank_name || '',
        bank_account_no: employee.bank_account_no || '',
        ifsc_code: employee.ifsc_code || '',
        pan_no: employee.pan_no || ''
      });
    }
    setIsEditing(false);
    setFormDirty(false);
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Employee name is required.');
      return;
    }
    if (!formData.work_email.trim()) {
      setError('Work email is required.');
      return;
    }
    if (!formData.job_position.trim()) {
      setError('Job position is required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const payload = {
        ...formData,
        manager_id: formData.manager_id ? Number(formData.manager_id) : undefined,
        working_schedule_id: formData.working_schedule_id ? Number(formData.working_schedule_id) : undefined
      };

      if (isNew) {
        const created = await employeeService.createEmployee(payload);
        setSuccessMsg(`Employee ${created.name} created successfully.`);
        setFormDirty(false);
        navigate(`/employees/${created.id}`);
      } else {
        const updated = await employeeService.updateEmployee(employeeId!, payload);
        setEmployee(updated);
        setIsEditing(false);
        setFormDirty(false);
        setSuccessMsg('Employee details updated successfully.');
      }
    } catch (err: any) {
      console.error('Failed to save employee:', err);
      setError(err.response?.data?.detail || 'Failed to save employee record.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!employee) return;
    const targetStatus = employee.status === 'active' ? 'inactive' : 'active';
    try {
      setStatusUpdating(true);
      setError(null);
      const updated = await employeeService.updateEmployeeStatus(employee.id, targetStatus);
      setEmployee(updated);
      setFormData((prev) => ({ ...prev, status: updated.status }));
      setShowDeactivateModal(false);
      setSuccessMsg(`Employee marked as ${targetStatus}. Historical records remain preserved.`);
    } catch (err: any) {
      console.error('Failed to change status:', err);
      setError(err.response?.data?.detail || 'Failed to update employee status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <RefreshCw className="w-8 h-8 text-odoo-purple animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-700">Loading employee operational hub...</p>
      </div>
    );
  }

  if (error && !employee && !isNew) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
        <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Employee Record Not Found</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">{error}</p>
        <div>
          <button
            onClick={() => navigate('/employees')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-odoo-purple hover:bg-purple-900 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Employees</span>
          </button>
        </div>
      </div>
    );
  }

  const initials = formData.name
    ? formData.name
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'EM';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/employees')}
            className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Back to Employees list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Link to="/employees" className="hover:text-odoo-purple">
                Employees
              </Link>
              <span>/</span>
              <span className="text-slate-800">
                {isNew ? 'New Employee' : employee?.name || 'Employee Profile'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              {isNew ? 'Create New Employee' : employee?.name}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-odoo-purple hover:bg-purple-900 text-white rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
            </>
          ) : (
            <>
              {canManageHR && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-odoo-purple hover:bg-purple-900 text-white rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDeactivateModal(true)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                      employee?.status === 'active'
                        ? 'border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100/60'
                        : 'border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100/60'
                    }`}
                  >
                    <PowerOff className="w-4 h-4" />
                    <span>{employee?.status === 'active' ? 'Deactivate' : 'Activate'}</span>
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Success / Error Banners */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Smart Buttons Top Navigation (for Existing Employees) */}
      {!isNew && employee && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Live Operational Records
          </div>
          <EmployeeSmartButtons employee={employee} />
        </div>
      )}

      {/* Main Form Sheet */}
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Form Title & Top Banner */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Avatar / Name Header */}
          <div className="flex items-center gap-4">
            {formData.avatar_url ? (
              <img
                src={formData.avatar_url}
                alt={formData.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xl shadow-sm border-2 border-white">
                {initials}
              </div>
            )}

            <div>
              {isEditing ? (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-500">
                    Employee Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Mehta"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="text-lg font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-odoo-purple w-full sm:w-80"
                  />
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{employee?.name}</h2>
                  <p className="text-sm font-medium text-slate-500 mt-0.5">
                    {employee?.job_position} &bull; {employee?.department}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Status & Code Display */}
          <div className="flex items-center gap-3">
            {!isNew && (
              <div className="text-right">
                <span className="text-xs text-slate-400 font-medium">Employee Code</span>
                <p className="font-mono text-sm font-bold text-slate-700">{employee?.employee_code}</p>
              </div>
            )}

            <div className="text-right">
              <span className="text-xs text-slate-400 font-medium">Status</span>
              <div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    formData.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : formData.status === 'on_leave'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {formData.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Body - 3 Major Sections */}
        <div className="p-6 space-y-8">
          
          {/* Section 1: Identity & Contact Info */}
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-sm font-bold text-slate-800 uppercase tracking-wider">
              <User className="w-4 h-4 text-odoo-purple" />
              <span>1. Identity & Contact Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
              
              {/* Work Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Work Email <span className="text-rose-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    required
                    placeholder="aarav@company.com"
                    value={formData.work_email}
                    onChange={(e) => handleInputChange('work_email', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-odoo-purple"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-800 py-1.5">{employee?.work_email || '-'}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Work Phone
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    placeholder="+1 (555) 012-3456"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-odoo-purple"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-800 py-1.5">{employee?.phone || '-'}</p>
                )}
              </div>

              {/* Avatar URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Avatar Image URL
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.avatar_url}
                    onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-odoo-purple"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-800 py-1.5 truncate">
                    {employee?.avatar_url || 'Using generated initials'}
                  </p>
                )}
              </div>

            </div>
          </div>

          {/* Section 2: Work & Organizational Hierarchy */}
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-sm font-bold text-slate-800 uppercase tracking-wider">
              <Briefcase className="w-4 h-4 text-odoo-purple" />
              <span>2. Work Organization & Hierarchy</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
              
              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Department <span className="text-rose-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    required
                    placeholder="e.g. Engineering"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-odoo-purple"
                    list="departments-list"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-800 py-1.5">{employee?.department || '-'}</p>
                )}
                {options && (
                  <datalist id="departments-list">
                    {options.departments.map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                )}
              </div>

              {/* Job Position */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Job Position <span className="text-rose-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Software Engineer"
                    value={formData.job_position}
                    onChange={(e) => handleInputChange('job_position', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-odoo-purple"
                    list="positions-list"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-800 py-1.5">{employee?.job_position || '-'}</p>
                )}
                {options && (
                  <datalist id="positions-list">
                    {options.job_positions.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                )}
              </div>

              {/* Manager */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Manager
                </label>
                {isEditing ? (
                  <select
                    value={formData.manager_id}
                    onChange={(e) => handleInputChange('manager_id', parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-odoo-purple cursor-pointer"
                  >
                    <option value={0}>-- No Manager Assigned --</option>
                    {options?.managers
                      .filter((m) => !employeeId || m.id !== employeeId)
                      .map((mgr) => (
                        <option key={mgr.id} value={mgr.id}>
                          {mgr.name} ({mgr.job_position})
                        </option>
                      ))}
                  </select>
                ) : (
                  <p className="text-sm font-medium text-slate-800 py-1.5">
                    {employee?.manager_name || <span className="text-slate-400 italic">None</span>}
                  </p>
                )}
              </div>

              {/* Work Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Work Location
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    placeholder="e.g. Headquarters / Remote"
                    value={formData.work_location}
                    onChange={(e) => handleInputChange('work_location', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-odoo-purple"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-800 py-1.5">{employee?.work_location || '-'}</p>
                )}
              </div>

              {/* Company */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Company
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-odoo-purple"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-800 py-1.5">{employee?.company || '-'}</p>
                )}
              </div>

              {/* Employment Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Employment Type
                </label>
                {isEditing ? (
                  <select
                    value={formData.employee_type}
                    onChange={(e) => handleInputChange('employee_type', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-odoo-purple cursor-pointer"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contractor">Contractor</option>
                    <option value="Intern">Intern</option>
                  </select>
                ) : (
                  <p className="text-sm font-medium text-slate-800 py-1.5">{employee?.employee_type || 'Full-Time'}</p>
                )}
              </div>

            </div>
          </div>

          {/* Section 3: Working Schedule & Banking / Statutory Details */}
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-sm font-bold text-slate-800 uppercase tracking-wider">
              <CreditCard className="w-4 h-4 text-odoo-purple" />
              <span>3. Working Schedule & Banking / Payroll Profile</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
              
              {/* Working Schedule */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Assigned Working Schedule
                </label>
                {isEditing ? (
                  <select
                    value={formData.working_schedule_id}
                    onChange={(e) => handleInputChange('working_schedule_id', parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-odoo-purple cursor-pointer"
                  >
                    <option value={0}>-- Select Working Schedule --</option>
                    {options?.working_schedules.map((sch) => (
                      <option key={sch.id} value={sch.id}>
                        {sch.name} ({sch.hours_per_week}h/week)
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm font-medium text-slate-800 py-1.5">
                    {employee?.working_schedule_name || <span className="text-slate-400 italic">None</span>}
                  </p>
                )}
              </div>

              {/* Bank Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Bank Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    placeholder="e.g. Chase Bank / Wells Fargo"
                    value={formData.bank_name}
                    onChange={(e) => handleInputChange('bank_name', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-odoo-purple"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-800 py-1.5">{employee?.bank_name || '-'}</p>
                )}
              </div>

              {/* Bank Account Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Bank Account Number
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={formData.bank_account_no}
                    onChange={(e) => handleInputChange('bank_account_no', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-odoo-purple font-mono"
                  />
                ) : (
                  <p className="text-sm font-medium font-mono text-slate-800 py-1.5">{employee?.bank_account_no || '-'}</p>
                )}
              </div>

              {/* IFSC / Routing Code */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  IFSC / Routing Code
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    placeholder="e.g. CHAS0001234"
                    value={formData.ifsc_code}
                    onChange={(e) => handleInputChange('ifsc_code', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-odoo-purple font-mono uppercase"
                  />
                ) : (
                  <p className="text-sm font-medium font-mono text-slate-800 py-1.5">{employee?.ifsc_code || '-'}</p>
                )}
              </div>

              {/* PAN / Tax Identification */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  PAN / Tax ID Number
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    placeholder="e.g. ABCDE1234F"
                    value={formData.pan_no}
                    onChange={(e) => handleInputChange('pan_no', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-odoo-purple font-mono uppercase"
                  />
                ) : (
                  <p className="text-sm font-medium font-mono text-slate-800 py-1.5">{employee?.pan_no || '-'}</p>
                )}
              </div>

            </div>
          </div>

        </div>

        {/* Form Footer Action Toolbar */}
        {isEditing && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={saving}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 bg-odoo-purple hover:bg-purple-900 text-white rounded-lg text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Employee'}</span>
            </button>
          </div>
        )}

      </form>

      {/* Deactivation Confirmation Modal Dialog */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {employee?.status === 'active' ? 'Deactivate Employee?' : 'Reactivate Employee?'}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {employee?.status === 'active' ? (
                    <>
                      <strong>{employee?.name}</strong> will be marked inactive. Historical contracts,
                      attendance, leave, and payroll records will remain safe and available for reporting.
                    </>
                  ) : (
                    <>
                      <strong>{employee?.name}</strong> will be marked active for HR operations.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-700">Historical Integrity Guarantee:</p>
              <p>&bull; Historical payslips and attendance records are never overwritten.</p>
              <p>&bull; Employee profile remains searchable under Inactive filters.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={statusUpdating}
                className={`px-4 py-2 text-white rounded-lg text-sm font-semibold transition-all shadow-sm ${
                  employee?.status === 'active'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                } disabled:opacity-50`}
              >
                {statusUpdating
                  ? 'Processing...'
                  : employee?.status === 'active'
                  ? 'Deactivate'
                  : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default EmployeeFormPage;
