import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../types/jwt.types';

export const User = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUser;
    return data ? user?.[data] : user;
  },
);
