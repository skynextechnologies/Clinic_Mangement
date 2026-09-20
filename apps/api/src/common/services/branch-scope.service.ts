import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '@clinicos/shared';

export interface ScopedUser {
  id: string;
  role: string;
  branchIds?: string[];
}

@Injectable()
export class BranchScopeService {
  /**
   * Generates Prisma `where` clause fragment for branch scoping based on user role and assigned branches.
   */
  getBranchWhere(user: ScopedUser, requestedBranchId?: string) {
    const isOwner = user.role === Role.OWNER;
    const userBranchIds = user.branchIds || [];

    if (requestedBranchId) {
      if (!isOwner && userBranchIds.length > 0 && !userBranchIds.includes(requestedBranchId)) {
        throw new ForbiddenException(`Access denied to branch ${requestedBranchId}`);
      }
      return { branchId: requestedBranchId };
    }

    if (isOwner) {
      return {};
    }

    if (userBranchIds.length === 1) {
      return { branchId: userBranchIds[0] };
    }

    if (userBranchIds.length > 1) {
      return { branchId: { in: userBranchIds } };
    }

    return {};
  }
}
