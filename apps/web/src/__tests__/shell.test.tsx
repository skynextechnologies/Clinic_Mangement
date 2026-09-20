import { describe, expect, it } from 'vitest';
import { Role, PERMISSIONS, hasPermission } from '@clinicos/shared';

describe('App Shell & Navigation Permissions', () => {
  it('should allow RECEPTIONIST role to access patients and appointments', () => {
    expect(hasPermission(Role.RECEPTIONIST, PERMISSIONS.PATIENTS_READ)).toBe(true);
    expect(hasPermission(Role.RECEPTIONIST, PERMISSIONS.APPOINTMENTS_READ)).toBe(true);
    expect(hasPermission(Role.RECEPTIONIST, PERMISSIONS.AUDIT_READ)).toBe(false);
  });

  it('should allow DOCTOR role to access consultations and prescriptions', () => {
    expect(hasPermission(Role.DOCTOR, PERMISSIONS.ENCOUNTERS_READ)).toBe(true);
    expect(hasPermission(Role.DOCTOR, PERMISSIONS.PRESCRIPTIONS_READ)).toBe(true);
    expect(hasPermission(Role.DOCTOR, PERMISSIONS.AUDIT_READ)).toBe(false);
  });

  it('should allow OWNER role to access all sections including audit logs', () => {
    expect(hasPermission(Role.OWNER, PERMISSIONS.AUDIT_READ)).toBe(true);
    expect(hasPermission(Role.OWNER, PERMISSIONS.PATIENTS_READ)).toBe(true);
  });
});
