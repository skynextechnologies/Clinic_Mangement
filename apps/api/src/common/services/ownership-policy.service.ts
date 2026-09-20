import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '@clinicos/shared';

export interface UserContext {
  id: string;
  role: string;
  patientId?: string;
  staffId?: string;
}

@Injectable()
export class OwnershipPolicyService {
  /**
   * Asserts user owns resource or has elevated administrative role.
   */
  assertOwnershipOrRole(
    user: UserContext,
    resourceOwnerId: string,
    allowedElevatedRoles: Role[] = [Role.OWNER, Role.ADMIN],
  ): void {
    if (allowedElevatedRoles.includes(user.role as Role)) {
      return;
    }

    const isSelfUser = user.id === resourceOwnerId;
    const isSelfPatient = user.patientId && user.patientId === resourceOwnerId;
    const isSelfStaff = user.staffId && user.staffId === resourceOwnerId;

    if (!isSelfUser && !isSelfPatient && !isSelfStaff) {
      throw new ForbiddenException('Access denied: You do not own this resource');
    }
  }
}
