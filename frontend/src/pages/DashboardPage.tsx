import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertCircle, 
  RotateCw 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/dashboardService';
import type { 
  DashboardData, 
  EmployeeDashboardData 
} from '../types';

import { PeriodSelector } from '../components/dashboard/PeriodSelector';
import { DashboardKpiCards } from '../components/dashboard/DashboardKpiCards';
import { CurrentPayrunWidget } from '../components/dashboard/CurrentPayrunWidget';
import { PayrollTrendWidget } from '../components/dashboard/PayrollTrendWidget';
import { DepartmentBreakdownWidget } from '../components/dashboard/DepartmentBreakdownWidget';
import { PendingAlertsWidget } from '../components/dashboard/PendingAlertsWidget';
import { RecentPayrunsWidget } from '../components/dashboard/RecentPayrunsWidget';
import { RecentActivityWidget } from '../components/dashboard/RecentActivityWidget';
import { QuickActionsBar } from '../components/dashboard/QuickActionsBar';
import { EmployeeDashboardView } from '../components/dashboard/EmployeeDashboardView';

export const DashboardPage: React.FC = () => {
  const { 
    isAdmin, 
    canManageHR, 
    canManagePayroll, 
    isEmployee 
  } = useAuth();

  // Determine if user is standard employee only or manager/admin
  const isSelfServiceOnly = isEmployee && !isAdmin && !canManageHR && !canManagePayroll;

  // State
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [employeeData, setEmployeeData] = useState<EmployeeDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');

  // Fetch Dashboard Data
  const loadDashboard = useCallback(async (period?: string, department?: string) => {
    setLoading(true);
    setError(null);
    try {
      if (isSelfServiceOnly) {
        const empResp = await dashboardService.getEmployeeDashboard();
        setEmployeeData(empResp);
      } else {
        const dashResp = await dashboardService.getDashboard({ period, department });
        setDashboardData(dashResp);
        if (!selectedPeriod && dashResp.period) {
          setSelectedPeriod(dashResp.period);
        }
      }
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err?.response?.data?.detail || err.message || 'Unable to connect to dashboard API.');
    } finally {
      setLoading(false);
    }
  }, [isSelfServiceOnly, selectedPeriod]);

  useEffect(() => {
    loadDashboard(selectedPeriod, selectedDepartment);
  }, [selectedPeriod, selectedDepartment, isSelfServiceOnly]);

  // Handle period change
  const handlePeriodChange = (newPeriod: string) => {
    setSelectedPeriod(newPeriod);
  };

  // Handle department change
  const handleDepartmentChange = (newDept: string) => {
    setSelectedDepartment(newDept);
  };

  // 1. Employee Self-Service Dashboard View
  if (isSelfServiceOnly && employeeData) {
    return <EmployeeDashboardView data={employeeData} />;
  }

  // 2. Loading Skeletons
  if (loading && !dashboardData && !employeeData) {
    return (
      <div className="space-y-6 pb-12 animate-pulse">
        <div className="h-20 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-28 bg-slate-200 rounded-xl" />
          <div className="h-28 bg-slate-200 rounded-xl" />
          <div className="h-28 bg-slate-200 rounded-xl" />
          <div className="h-28 bg-slate-200 rounded-xl" />
        </div>
        <div className="h-56 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 rounded-xl" />
          <div className="h-64 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  // 3. Error State with Retry
  if (error && !dashboardData) {
    return (
      <div className="bg-white rounded-xl p-8 border border-rose-200 shadow-sm text-center max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Dashboard Unavailable</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">{error}</p>
        <button
          onClick={() => loadDashboard(selectedPeriod, selectedDepartment)}
          className="inline-flex items-center gap-2 bg-[#714B67] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#5e3e56] transition-colors cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  // Extract department list for filter dropdown
  const departmentOptions = dashboardData?.employees?.department_counts 
    ? Object.keys(dashboardData.employees.department_counts)
    : [];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Period Selector & Company Bar */}
      {dashboardData && (
        <PeriodSelector
          selectedPeriod={selectedPeriod || dashboardData.period}
          availablePeriods={dashboardData.available_periods}
          onPeriodChange={handlePeriodChange}
          selectedDepartment={selectedDepartment}
          onDepartmentChange={handleDepartmentChange}
          departments={departmentOptions}
          onRefresh={() => loadDashboard(selectedPeriod, selectedDepartment)}
          isLoading={loading}
          companyName={dashboardData.company}
        />
      )}

      {/* 2. Operations Quick Launch Bar */}
      <QuickActionsBar 
        canManageHR={canManageHR} 
        canManagePayroll={canManagePayroll} 
      />

      {/* 3. Primary KPI Cards */}
      {dashboardData && (
        <DashboardKpiCards
          employees={dashboardData.employees}
          contracts={dashboardData.contracts}
          payroll={dashboardData.payroll}
          canViewFinancials={dashboardData.can_view_financials}
        />
      )}

      {/* 4. Current Payrun Overview Command Widget */}
      {dashboardData && (
        <CurrentPayrunWidget
          payrun={dashboardData.payrun}
          canManagePayroll={canManagePayroll}
        />
      )}

      {/* 5. Visual Analytics: 6-Month Trend & Department Breakdown */}
      {dashboardData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PayrollTrendWidget
            trendData={dashboardData.payroll_trend}
            canViewFinancials={dashboardData.can_view_financials}
          />

          <DepartmentBreakdownWidget
            departments={dashboardData.department_distribution}
            canViewFinancials={dashboardData.can_view_financials}
          />
        </div>
      )}

      {/* 6. Pending Actions & Recent Operations */}
      {dashboardData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Alerts (2 cols) */}
          <div className="lg:col-span-2">
            <PendingAlertsWidget alerts={dashboardData.alerts} />
          </div>

          {/* Activity Feed (1 col) */}
          <div className="lg:col-span-1">
            <RecentActivityWidget activities={dashboardData.recent_activity} />
          </div>
        </div>
      )}

      {/* 7. Recent Payruns Data Table */}
      {dashboardData && (
        <RecentPayrunsWidget
          recentPayruns={dashboardData.recent_payruns}
          canManagePayroll={canManagePayroll}
        />
      )}
    </div>
  );
};

export default DashboardPage;
