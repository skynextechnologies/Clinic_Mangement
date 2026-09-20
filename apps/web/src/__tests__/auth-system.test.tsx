import { describe, expect, it } from 'vitest';
import { Role, PERMISSIONS, hasPermission } from '@clinicos/shared';

describe('Auth & Permission System (Web)', () => {
  it('should verify permission checks for OWNER role', () => {
    expect(hasPermission(Role.OWNER, PERMISSIONS.USERS_READ)).toBe(true);
    expect(hasPermission(Role.OWNER, PERMISSIONS.USERS_CREATE)).toBe(true);
    expect(hasPermission(Role.OWNER, PERMISSIONS.AUDIT_READ)).toBe(true);
  });

  it('should verify permission restrictions for DOCTOR role', () => {
    expect(hasPermission(Role.DOCTOR, PERMISSIONS.APPOINTMENTS_READ)).toBe(true);
    expect(hasPermission(Role.DOCTOR, PERMISSIONS.ENCOUNTERS_CREATE)).toBe(true);
    expect(hasPermission(Role.DOCTOR, PERMISSIONS.AUDIT_READ)).toBe(false);
  });

  it('should verify permission restrictions for RECEPTIONIST role', () => {
    expect(hasPermission(Role.RECEPTIONIST, PERMISSIONS.APPOINTMENTS_CREATE)).toBe(true);
    expect(hasPermission(Role.RECEPTIONIST, PERMISSIONS.ENCOUNTERS_CREATE)).toBe(false);
    expect(hasPermission(Role.RECEPTIONIST, PERMISSIONS.PRESCRIPTIONS_CREATE)).toBe(false);
  });
});
