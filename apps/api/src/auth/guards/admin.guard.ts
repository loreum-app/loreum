import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AuthUser } from '../types/jwt.types';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser;

    if (!user?.roles.includes('ADMIN')) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
