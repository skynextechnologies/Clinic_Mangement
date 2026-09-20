import { useAuth } from '../providers/auth-provider';

/**
 * Custom hook to check if current user has permission
 */
export function useCan(permission: string): boolean {
  const { can } = useAuth();
  return can(permission);
}
