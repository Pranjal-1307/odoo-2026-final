import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            
            {/* Placeholder routes that will be fully implemented in subsequent modules */}
            <Route path="/employees" element={<DashboardPage />} />
            <Route path="/contracts" element={<DashboardPage />} />
            <Route path="/attendance" element={<DashboardPage />} />
            <Route path="/time-off/requests" element={<DashboardPage />} />
            <Route path="/time-off/allocations" element={<DashboardPage />} />
            <Route path="/time-off/types" element={<DashboardPage />} />
            <Route path="/payroll/payruns" element={<DashboardPage />} />
            <Route path="/payroll/payslips" element={<DashboardPage />} />
            <Route path="/payroll/salary-structures" element={<DashboardPage />} />
            <Route path="/payroll/salary-rules" element={<DashboardPage />} />
            <Route path="/schedules" element={<DashboardPage />} />
            <Route path="/users" element={<DashboardPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
