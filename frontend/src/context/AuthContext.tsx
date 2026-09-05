import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User, permissions?: string[]) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  
  // Permission & Role query helpers
  isAdmin: boolean;
  isHRManager: boolean;
  isPayrollManager: boolean;
  isPayrollUser: boolean;
  isEmployee: boolean;
  hasRole: (...roles: UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
  can: (permission: string) => boolean;

  // Granular capability shortcuts
  canManageHR: boolean;
  canManagePayroll: boolean;
  canConfigurePayroll: boolean;
  canApproveLeave: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem('peoplepay360_token');
    localStorage.removeItem('peoplepay360_user');
    localStorage.removeItem('peoplepay360_permissions');
    setToken(null);
    setUser(null);
    setPermissions([]);
    authService.logout().catch(() => {});
  }, []);

  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem('peoplepay360_token');
    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await authService.getMe();
      setUser(userData);
      setPermissions(userData.permissions || []);
      localStorage.setItem('peoplepay360_user', JSON.stringify(userData));
      localStorage.setItem('peoplepay360_permissions', JSON.stringify(userData.permissions || []));
    } catch (error) {
      console.error('Session validation failed:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    const savedToken = localStorage.getItem('peoplepay360_token');
    const savedUser = localStorage.getItem('peoplepay360_user');
    const savedPerms = localStorage.getItem('peoplepay360_permissions');
    
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        if (savedPerms) {
          setPermissions(JSON.parse(savedPerms));
        }
        // Verify with backend silently
        refreshUser();
        return;
      } catch (err) {
        console.error('Failed to restore session:', err);
        logout();
      }
    }
    setIsLoading(false);
  }, [logout, refreshUser]);

  const login = (newToken: string, newUser: User, newPermissions: string[] = []) => {
    localStorage.setItem('peoplepay360_token', newToken);
    localStorage.setItem('peoplepay360_user', JSON.stringify(newUser));
    localStorage.setItem('peoplepay360_permissions', JSON.stringify(newPermissions));
    setToken(newToken);
    setUser(newUser);
    setPermissions(newPermissions);
  };

  const role = user?.role;
  const isAdmin = role === 'Admin';
  const isHRManager = role === 'HR Manager' || isAdmin;
  const isPayrollManager = role === 'HR Payroll Manager' || isAdmin;
  const isPayrollUser = role === 'HR Payroll User' || isPayrollManager || isAdmin;
  const isEmployee = role === 'Employee';

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    return roles.includes(user.role);
  };

  const hasPermission = (perm: string): boolean => {
    if (!user) return false;
    if (user.role === 'Admin' || permissions.includes('*')) return true;
    return permissions.includes(perm);
  };

  // Granular capability shortcuts
  const canManageHR = isAdmin || isHRManager || isPayrollManager || isPayrollUser;
  const canManagePayroll = isAdmin || isPayrollManager || isPayrollUser;
  const canConfigurePayroll = isAdmin || isPayrollManager;
  const canApproveLeave = isAdmin || isHRManager || isPayrollManager;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        permissions,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        refreshUser,
        isAdmin,
        isHRManager,
        isPayrollManager,
        isPayrollUser,
        isEmployee,
        hasRole,
        hasPermission,
        can: hasPermission,
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
