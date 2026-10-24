import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SESSION_LIFETIME_SECONDS, SESSION_TOKEN_BYTES } from '@repo/constants';
import { Session } from '@repo/schemas';
import { createHash, randomBytes } from 'crypto';
import { ClientSession, Model, Types } from 'mongoose';

/**
 * Turns the token the browser holds into the value stored beside it. A plain
 * digest is enough here: the token is 256 bits of randomness, so it is not
 * guessable the way a password is, and bcrypt's slowness would only tax the
 * lookup that runs on every single request.
 */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

type SessionContext = { ip?: string; userAgent?: string };

@Injectable()
export class SessionModel {
  private readonly logger = new Logger(SessionModel.name);

  constructor(@InjectModel(Session.name) private Session: Model<Session>) {}

  /**
   * Opens a session and hands back the raw token. This is the only moment the
   * token exists anywhere but the browser -- what is written down is its digest,
   * which cannot be turned back into a working cookie.
   */
  async create(user: Types.ObjectId, { ip, userAgent }: SessionContext = {}): Promise<string> {
    try {
      const token = randomBytes(SESSION_TOKEN_BYTES).toString('hex');

      await this.Session.create([{ hashedToken: hashSessionToken(token), user, ip, userAgent }]);

      return token;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  /**
   * The id of whoever the token belongs to, or null when it matches nothing or
   * has aged out.
   *
   * The age is checked here rather than left to the TTL index: Mongo sweeps
   * expired documents only about once a minute, which is long enough for a
   * session to outlive its own expiry on a busy route.
   */
  async getUserIdByToken(token: string): Promise<Types.ObjectId | null> {
    try {
      const session = await this.Session.findOne(
        { hashedToken: hashSessionToken(token) },
        { user: 1, dateCreated: 1 },
      ).lean();

      if (!session) return null;

      const ageInSeconds = (Date.now() - session.dateCreated.getTime()) / 1000;

      if (ageInSeconds >= SESSION_LIFETIME_SECONDS) {
        await this.revoke(token);
        return null;
      }

      return session.user;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  /** Ends one session. Silent when the token matches nothing -- logging out twice is not an error. */
  async revoke(token: string): Promise<void> {
    try {
      await this.Session.deleteOne({ hashedToken: hashSessionToken(token) });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  /**
   * Ends every session a user owns, optionally sparing the one making the
   * request -- what a password change wants, so the device doing the changing
   * stays logged in while the others are turned out.
   */
  async revokeAllForUser(
    user: Types.ObjectId,
    { except, session }: { except?: string; session?: ClientSession } = {},
  ): Promise<void> {
    try {
      const filter: Record<string, unknown> = { user };

      if (except) filter.hashedToken = { $ne: hashSessionToken(except) };

      await this.Session.deleteMany(filter, { session });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }
}
