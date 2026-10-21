import { Injectable } from '@nestjs/common';
import { AuthServiceOptions } from '@repo/enums';
import { SessionModel, UserModel } from '@repo/models';
import type { UserDocument } from '@repo/schemas';
import type { AuthenticatedUser } from '@repo/types';
import { Types } from 'mongoose';
import { LoginDto } from './dto/login.dto';

/** What is recorded about the browser a session was opened from. */
export type SessionContext = { ip?: string; userAgent?: string };

/** The fields a google profile contributes to an account. */
export type GoogleProfile = {
  googleId: string;
  email: string;
  emailVerified: boolean;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly userModel: UserModel,
    private readonly sessionModel: SessionModel,
  ) {}

  /**
   * Strips a user document down to what may leave the server. `_id` becomes
   * `id` because that is the name the client reads, and the password hash goes
   * whether or not the query happened to select it.
   */
  private toAuthenticatedUser(user: UserDocument): AuthenticatedUser {
    const { _id, __v, password, ...rest } = user.toObject();

    return { id: String(_id), ...rest };
  }

  /**
   * Whoever the email and password belong to, or null. Called by
   * `LocalStrategy`, which turns the null into the rejection the route answers
   * with -- a strategy decides who the caller is and nothing more.
   */
  async validateCredentials({
    email,
    password,
  }: LoginDto): Promise<AuthenticatedUser | null> {
    const user = await this.userModel.getUserByEmailWithPassword(email);

    const matched = await this.userModel.verifyPassword(
      password,
      user?.password,
    );

    if (!user || !matched) return null;

    return this.toAuthenticatedUser(user);
  }

  /**
   * The account behind a google profile, opening one the first time somebody
   * arrives with a new address.
   *
   * An existing account is matched on the verified email and gains google as a
   * second way in. The match is only safe because google is the one asserting
   * the address: an unverified profile is turned away by the strategy before it
   * ever reaches here.
   */
  async findOrCreateGoogleUser(
    profile: GoogleProfile,
  ): Promise<AuthenticatedUser> {
    const existing = await this.userModel.getUserByGoogleIdOrEmail(profile);

    if (existing) {
      const linked = await this.userModel.linkGoogleAccount(
        existing._id,
        profile.googleId,
      );

      return this.toAuthenticatedUser(linked ?? existing);
    }

    const created = await this.userModel.create({
      email: profile.email,
      googleId: profile.googleId,
      authService: AuthServiceOptions.WITH_GOOGLE,
    });

    return this.toAuthenticatedUser(created);
  }

  /**
   * Opens a session for an already-identified user and returns the raw token
   * for the caller to put in a cookie.
   *
   * Both strategies end here, which is what keeps the local and google paths
   * from drifting: whatever proved who you are, the session that follows is
   * built and revoked the same way.
   */
  async issueSession(
    user: AuthenticatedUser,
    context: SessionContext = {},
  ): Promise<string> {
    return this.sessionModel.create(new Types.ObjectId(user.id), context);
  }

  /**
   * Whoever the cookie belongs to, or null when the token is unknown, expired,
   * or points at a user who no longer exists.
   */
  async resolveSession(token: string): Promise<AuthenticatedUser | null> {
    const userId = await this.sessionModel.getUserIdByToken(token);

    if (!userId) return null;

    const user = await this.userModel.getUserById(userId);

    if (!user) {
      await this.sessionModel.revoke(token);
      return null;
    }

    return this.toAuthenticatedUser(user);
  }

  /** Ends the session behind a token. Unknown tokens are not an error. */
  async logout(token: string): Promise<void> {
    await this.sessionModel.revoke(token);
  }
}
