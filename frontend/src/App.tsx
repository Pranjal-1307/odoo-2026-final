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
            <Route
              path="/contracts"
              element={
                <ProtectedRoute allowedRoles={['HR Manager', 'HR Payroll Manager', 'HR Payroll User', 'Admin']}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/time-off/requests"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/time-off/allocations"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/time-off/types"
              element={
                <ProtectedRoute allowedRoles={['HR Manager', 'HR Payroll Manager', 'HR Payroll User', 'Admin']}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
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
            <Route
              path="/schedules"
              element={
                <ProtectedRoute allowedRoles={['HR Manager', 'HR Payroll Manager', 'HR Payroll User', 'Admin']}>
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
