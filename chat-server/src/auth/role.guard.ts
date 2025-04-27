import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getToken } from './auth.guard';

@Injectable()
abstract class RoleGuard implements CanActivate {
  constructor(protected readonly jwtService: JwtService) {}

  abstract allowedRoles: string[];

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = getToken(request.headers);
    if (!token)
      throw new UnauthorizedException('Unauthorized access: No token provided');

    try {
      const payload = await this.jwtService.verify(token);
      const role = payload.role;
      if (!role) throw new BadRequestException('Role is not provided');

      if (!this.allowedRoles.includes(role)) {
        throw new ForbiddenException('Access denied: Insufficient role');
      }

      request.role = payload.role;

      return true;
    } catch (e) {
      throw new UnauthorizedException('Unauthorized access: ', e.message);
    }
  }
}

@Injectable()
export class IsCustomer extends RoleGuard {
  allowedRoles = ['customer', 'agent', 'admin'];
}

@Injectable()
export class IsAgent extends RoleGuard {
  allowedRoles = ['agent', 'admin'];
}
@Injectable()
export class IsAdmin extends RoleGuard {
  allowedRoles = ['admin'];
}
