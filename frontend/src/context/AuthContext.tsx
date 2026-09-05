import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
  
  // Permission helpers
  isAdmin: boolean;
  isHRManager: boolean;
  isPayrollManager: boolean;
  isPayrollUser: boolean;
  isEmployee: boolean;
  canManageHR: boolean;
  canManagePayroll: boolean;
  canConfigurePayroll: boolean;
  canApproveLeave: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('peoplepay360_token');
    const savedUser = localStorage.getItem('peoplepay360_user');
    
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error('Failed to parse saved user:', err);
        localStorage.removeItem('peoplepay360_token');
        localStorage.removeItem('peoplepay360_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('peoplepay360_token', newToken);
    localStorage.setItem('peoplepay360_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('peoplepay360_token');
    localStorage.removeItem('peoplepay360_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const role = user?.role;
  const isAdmin = role === 'Admin';
  const isHRManager = role === 'HR Manager' || isAdmin;
  const isPayrollManager = role === 'HR Payroll Manager' || isAdmin;
  const isPayrollUser = role === 'HR Payroll User' || isPayrollManager;
  const isEmployee = role === 'Employee';

  // Permission capabilities
  const canManageHR = isAdmin || isHRManager || isPayrollManager || isPayrollUser;
  const canManagePayroll = isAdmin || isPayrollManager || isPayrollUser;
  const canConfigurePayroll = isAdmin || isPayrollManager;
  const canApproveLeave = isAdmin || isHRManager || isPayrollManager;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isLoading,
        isAdmin,
        isHRManager,
        isPayrollManager,
        isPayrollUser,
        isEmployee,
        canManageHR,
        canManagePayroll,
        canConfigurePayroll,
        canApproveLeave,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
