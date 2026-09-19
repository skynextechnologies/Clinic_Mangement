import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUserPayload {
  userId: string;
  email: string;
  roles: string[];
  branchIds: string[];
  familyId?: string;
  sessionId?: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUserPayload | undefined;

    if (!user) return undefined;
    return data ? user[data] : user;
  },
);
