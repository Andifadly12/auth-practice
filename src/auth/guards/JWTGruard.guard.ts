import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestWithUser } from '../interfaces/interficeRequestWithUser';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class JWTGruard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler,
      context.getClass,
    ]);

    if (!allowedRoles) {
      return true;
    }

    const reques = context.switchToHttp().getRequest<RequestWithUser>();

    const user = reques.user;

    if (!user) {
      return false;
    }

    return allowedRoles.includes(user.role);
  }
}
