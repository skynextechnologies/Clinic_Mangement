import { describe, expect, it } from 'vitest';
import { Role } from '../roles.js';
import { PERMISSIONS, ROLE_PERMISSIONS, hasPermission } from '../permissions.js';

describe('RBAC Permission Matrix (Architecture 7.2 Verification)', () => {
  it('assigns all permissions to OWNER', () => {
    const ownerPerms = ROLE_PERMISSIONS[Role.OWNER];
    expect(ownerPerms).toHaveLength(Object.keys(PERMISSIONS).length);
  });

  it('verifies DOCTOR permissions', () => {
    expect(hasPermission(Role.DOCTOR, PERMISSIONS.ENCOUNTERS_CREATE)).toBe(true);
    expect(hasPermission(Role.DOCTOR, PERMISSIONS.PRESCRIPTIONS_EXECUTE)).toBe(true);
    expect(hasPermission(Role.DOCTOR, PERMISSIONS.AUDIT_READ)).toBe(false);
  });

  it('verifies NURSE permissions', () => {
    expect(hasPermission(Role.NURSE, PERMISSIONS.VITALS_CREATE)).toBe(true);
    expect(hasPermission(Role.NURSE, PERMISSIONS.ENCOUNTERS_CREATE)).toBe(false);
    expect(hasPermission(Role.NURSE, PERMISSIONS.PRESCRIPTIONS_EXECUTE)).toBe(false);
  });

  it('verifies RECEPTIONIST permissions', () => {
    expect(hasPermission(Role.RECEPTIONIST, PERMISSIONS.PATIENTS_CREATE)).toBe(true);
    expect(hasPermission(Role.RECEPTIONIST, PERMISSIONS.APPOINTMENTS_CREATE)).toBe(true);
    expect(hasPermission(Role.RECEPTIONIST, PERMISSIONS.INVOICES_EXECUTE)).toBe(true);
    expect(hasPermission(Role.RECEPTIONIST, PERMISSIONS.ENCOUNTERS_CREATE)).toBe(false);
  });

  it('verifies PHARMACIST permissions', () => {
    expect(hasPermission(Role.PHARMACIST, PERMISSIONS.INVENTORY_CREATE)).toBe(true);
    expect(hasPermission(Role.PHARMACIST, PERMISSIONS.DISPENSING_EXECUTE)).toBe(true);
    expect(hasPermission(Role.PHARMACIST, PERMISSIONS.LAB_EXECUTE)).toBe(false);
  });

  it('verifies LAB_TECH permissions', () => {
    expect(hasPermission(Role.LAB_TECH, PERMISSIONS.LAB_EXECUTE)).toBe(true);
    expect(hasPermission(Role.LAB_TECH, PERMISSIONS.DISPENSING_EXECUTE)).toBe(false);
  });

  it('verifies ACCOUNTANT permissions', () => {
    expect(hasPermission(Role.ACCOUNTANT, PERMISSIONS.INVOICES_EXECUTE)).toBe(true);
    expect(hasPermission(Role.ACCOUNTANT, PERMISSIONS.REFUNDS_APPROVE)).toBe(true);
    expect(hasPermission(Role.ACCOUNTANT, PERMISSIONS.AUDIT_READ_FIN)).toBe(true);
    expect(hasPermission(Role.ACCOUNTANT, PERMISSIONS.ENCOUNTERS_CREATE)).toBe(false);
  });

  it('verifies PATIENT permissions', () => {
    expect(hasPermission(Role.PATIENT, PERMISSIONS.APPOINTMENTS_CREATE)).toBe(true);
    expect(hasPermission(Role.PATIENT, PERMISSIONS.INVOICES_READ)).toBe(true);
    expect(hasPermission(Role.PATIENT, PERMISSIONS.PATIENTS_CREATE)).toBe(false);
  });

  it('returns false for unassigned permissions or unknown roles', () => {
    expect(hasPermission('INVALID' as Role, PERMISSIONS.USERS_READ)).toBe(false);
  });
});
