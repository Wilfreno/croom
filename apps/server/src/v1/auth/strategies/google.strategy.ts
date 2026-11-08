import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { AuthenticatedUser } from '@repo/types';
import { requireEnv } from '@repo/utils';
import { Profile, Strategy, StrategyOptions } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { CookieStateStore } from './cookie-state.store';

/**
 * Runs the oauth handshake with google and ends at an account, the same place
 * `LocalStrategy` ends.
 *
 * Google's access and refresh tokens are read for the profile and then dropped:
 * croom asks google who somebody is once, at sign-in, and never calls a google
 * api on their behalf, so keeping the tokens would be storing a credential
 * nothing needs.
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    const serverUrl = requireEnv(configService, 'SERVER_URL').replace(
      /\/+$/,
      '',
    );

    /**
     * `store` is a passport-oauth2 option that the google typings do not
     * re-export, so the shape has to be asserted. It is honored at runtime --
     * the base strategy is the one that reads it.
     */
    super({
      clientID: requireEnv(configService, 'GOOGLE_CLIENT_ID'),
      clientSecret: requireEnv(configService, 'GOOGLE_CLIENT_SECRET'),
      callbackURL: `${serverUrl}/v1/auth/google/callback`,
      scope: ['profile', 'email'],
      store: new CookieStateStore(),
    } as unknown as StrategyOptions);
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<AuthenticatedUser> {
    const email = profile.emails?.[0];

    if (!email?.value)
      throw new UnauthorizedException('google returned no email address');

    if (String(email.verified) !== 'true')
      throw new UnauthorizedException('google has not verified that address');

    return this.authService.findOrCreateGoogleUser({ email: email.value });
  }
}
