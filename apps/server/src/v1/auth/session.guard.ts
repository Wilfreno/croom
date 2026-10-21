import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AUTH_PUBLIC_KEY, SESSION_COOKIE } from '@repo/constants';
import type { FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';

/**
 * Resolves the session cookie into `request.user` before any handler runs.
 *
 * Registered once as an `APP_GUARD`, so every route in the app is authenticated
 * unless it carries `@Public()`. Guards run ahead of pipes, so nothing here may
 * assume a validated body -- the cookie is all it reads.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(
      AUTH_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = request.cookies?.[SESSION_COOKIE];

    if (!token) throw new UnauthorizedException('you are not logged in');

    const user = await this.authService.resolveSession(token);

    if (!user)
      throw new UnauthorizedException('your session has expired, log in again');

    request.user = user;

    return true;
  }
}
