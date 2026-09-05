import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { UsersPage } from './pages/UsersPage';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { EmployeeFormPage } from './pages/EmployeeFormPage';
import { ContractsPage } from './pages/ContractsPage';
import { ContractFormPage } from './pages/ContractFormPage';
import { WorkingSchedulesPage } from './pages/WorkingSchedulesPage';
import { WorkingScheduleFormPage } from './pages/WorkingScheduleFormPage';
import { AttendancePage } from './pages/AttendancePage';
import { AttendanceFormPage } from './pages/AttendanceFormPage';
import { TimeOffRequestsPage } from './pages/TimeOffRequestsPage';
import { TimeOffRequestFormPage } from './pages/TimeOffRequestFormPage';
import { TimeOffAllocationsPage } from './pages/TimeOffAllocationsPage';
import { TimeOffAllocationFormPage } from './pages/TimeOffAllocationFormPage';
import { TimeOffTypesPage } from './pages/TimeOffTypesPage';
import { TimeOffTypeFormPage } from './pages/TimeOffTypeFormPage';


export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/403" element={<UnauthorizedPage />} />

          {/* Protected Application Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            
            {/* Admin-only User & Role Management */}
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />

            {/* Employee Master Hub Routes */}
            <Route
              path="/employees"
              element={
                <ProtectedRoute>
                  <EmployeesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/new"
              element={
                <ProtectedRoute allowedRoles={['HR Manager', 'HR Payroll Manager', 'HR Payroll User', 'Admin']}>
                  <EmployeeFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/:id"
              element={
                <ProtectedRoute>
                  <EmployeeFormPage />
                </ProtectedRoute>
              }
            />

            {/* Contract Management Hub Routes */}
            <Route
              path="/contracts"
              element={
                <ProtectedRoute>
                  <ContractsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contracts/new"
              element={
                <ProtectedRoute allowedRoles={['HR Manager', 'HR Payroll Manager', 'HR Payroll User', 'Admin']}>
                  <ContractFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contracts/:id"
              element={
                <ProtectedRoute>
                  <ContractFormPage />
                </ProtectedRoute>
              }
            />

            {/* Working Schedules Hub Routes */}
            <Route
              path="/working-schedules"
              element={
                <ProtectedRoute>
                  <WorkingSchedulesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/working-schedules/new"
              element={
                <ProtectedRoute allowedRoles={['HR Manager', 'HR Payroll Manager', 'Admin']}>
                  <WorkingScheduleFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/working-schedules/:id"
              element={
                <ProtectedRoute>
                  <WorkingScheduleFormPage />
                </ProtectedRoute>
              }
            />
            <Route path="/schedules" element={<Navigate to="/working-schedules" replace />} />

            {/* Attendance Management Hub Routes */}
            <Route
              path="/attendance"
              element={
                <ProtectedRoute>
                  <AttendancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance/new"
              element={
                <ProtectedRoute allowedRoles={['HR Manager', 'HR Payroll Manager', 'HR Payroll User', 'Admin']}>
                  <AttendanceFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance/:id"
              element={
                <ProtectedRoute>
                  <AttendanceFormPage />
                </ProtectedRoute>
              }
            />

            {/* Time Off Hub Routes */}
            <Route
              path="/time-off"
              element={<Navigate to="/time-off/requests" replace />}
            />
            <Route
              path="/time-off/requests"
              element={
                <ProtectedRoute>
                  <TimeOffRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/time-off/requests/new"
              element={
                <ProtectedRoute>
                  <TimeOffRequestFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/time-off/requests/:id"
              element={
                <ProtectedRoute>
                  <TimeOffRequestFormPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/time-off/allocations"
              element={
                <ProtectedRoute>
                  <TimeOffAllocationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/time-off/allocations/new"
              element={
                <ProtectedRoute allowedRoles={['HR Manager', 'HR Payroll Manager', 'Admin']}>
                  <TimeOffAllocationFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/time-off/allocations/:id"
              element={
                <ProtectedRoute allowedRoles={['HR Manager', 'HR Payroll Manager', 'Admin']}>
                  <TimeOffAllocationFormPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/time-off/types"
              element={
                <ProtectedRoute allowedRoles={['HR Manager', 'HR Payroll Manager', 'HR Payroll User', 'Admin']}>
                  <TimeOffTypesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/time-off/types/new"
              element={
                <ProtectedRoute allowedRoles={['HR Manager', 'HR Payroll Manager', 'Admin']}>
                  <TimeOffTypeFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/time-off/types/:id"
              element={
                <ProtectedRoute allowedRoles={['HR Manager', 'HR Payroll Manager', 'Admin']}>
                  <TimeOffTypeFormPage />
                </ProtectedRoute>
              }
            />

            {/* Payroll Routes */}
            <Route
              path="/payroll/payruns"
              element={
                <ProtectedRoute allowedRoles={['HR Payroll Manager', 'HR Payroll User', 'Admin']}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/payslips"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/salary-structures"
              element={
                <ProtectedRoute allowedRoles={['HR Payroll Manager', 'HR Payroll User', 'Admin']}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/salary-rules"
              element={
                <ProtectedRoute allowedRoles={['HR Payroll Manager', 'HR Payroll User', 'Admin']}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
