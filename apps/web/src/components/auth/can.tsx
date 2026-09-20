import React from 'react';
import { useCan } from '../../hooks/use-can';

interface CanProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * PermissionGate component to conditionally render UI elements based on user permissions
 */
export function Can({ permission, children, fallback = null }: CanProps) {
  const allowed = useCan(permission);
  if (!allowed) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
