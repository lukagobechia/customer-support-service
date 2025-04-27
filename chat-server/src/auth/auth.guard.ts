import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = getToken(request.headers);
    if (!token)
      throw new UnauthorizedException('Unauthorized access: No token provided');

    try {
      const payload = await this.jwtService.verify(token);

      if (!payload.status)
        throw new UnauthorizedException('Account is not verified');

      request.user = {
        userId: payload.userId,
        status: payload.status,
        userEmail: payload.userEmail,
        role: payload.role,
      };
      return true;
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException(error.message);
    }
  }
}

export function getToken(headers: Record<string, any>): string | null {
  if (!headers['authorization']) {
    throw new UnauthorizedException('No authorization header provided');
  }
  const [type, token] = headers['authorization'].split(' ');

  return type === 'Bearer' ? token : null;
}
