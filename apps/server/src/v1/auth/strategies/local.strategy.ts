import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { INVALID_CREDENTIALS } from '@repo/constants';
import type { AuthenticatedUser } from '@repo/types';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

/**
 * Verifies an email and password. Passport calls `validate` with the two fields
 * named below and hangs whatever it returns on `request.user`; throwing is how
 * a rejection is reported, and the message is the same for every cause so the
 * route cannot be used to find out which emails have accounts.
 *
 * Issuing the session is deliberately not done here. A strategy's job ends at
 * saying who the caller is, which is what lets the google strategy end at the
 * same place and share everything that happens afterwards.
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  async validate(email: string, password: string): Promise<AuthenticatedUser> {
    const user = await this.authService.validateCredentials({
      email,
      password,
    });

    if (!user) throw new UnauthorizedException(INVALID_CREDENTIALS);

    return user;
  }
}
