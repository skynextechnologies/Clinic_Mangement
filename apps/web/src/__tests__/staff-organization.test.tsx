import { describe, expect, it } from 'vitest';
import {
  createBranchSchema,
  createDepartmentSchema,
  createRoomSchema,
  inviteStaffSchema,
  acceptInvitationSchema,
} from '@clinicos/shared';

describe('Staff & Organization Management (Web Schemas)', () => {
  it('should validate branch creation schema', () => {
    const valid = createBranchSchema.parse({
      code: 'MAIN01',
      name: 'Central Clinic',
      timezone: 'UTC',
    });
    expect(valid.code).toBe('MAIN01');

    expect(() =>
      createBranchSchema.parse({
        code: 'invalid code!',
        name: 'Short',
      }),
    ).toThrow();
  });

  it('should validate department creation schema', () => {
    const valid = createDepartmentSchema.parse({
      name: 'Cardiology',
      description: 'Heart care',
    });
    expect(valid.name).toBe('Cardiology');
  });

  it('should validate room creation schema', () => {
    const valid = createRoomSchema.parse({
      branchId: 'branch-1',
      name: 'Consultation Room 1',
    });
    expect(valid.name).toBe('Consultation Room 1');
  });

  it('should validate staff invitation & acceptance schemas', () => {
    const validInvite = inviteStaffSchema.parse({
      email: 'doctor@clinicos.local',
      roles: ['DOCTOR'],
      branchIds: ['branch-1'],
    });
    expect(validInvite.email).toBe('doctor@clinicos.local');

    const validAccept = acceptInvitationSchema.parse({
      token: 'inv-token-123',
      firstName: 'Jane',
      lastName: 'Doe',
      password: 'DocPassword123!',
    });
    expect(validAccept.firstName).toBe('Jane');
  });
});
