import React from 'react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: string;
  roles?: UserRole[];
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  roles,
  fallback = null,
}) => {
  const { hasPermission, hasRole } = useAuth();

  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  if (roles && roles.length > 0 && !hasRole(...roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
