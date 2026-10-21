import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SESSION_LIFETIME_SECONDS } from '@repo/constants';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.schema';

export type SessionDocument = HydratedDocument<Session>;

/**
 * One logged-in browser. The token the browser holds is never stored -- only
 * its digest -- so a leaked dump cannot be replayed as a live session.
 *
 * Sessions are rows rather than signed tokens because croom has to be able to
 * take them back: changing a password signs the other devices out, and deleting
 * an account has to end every session it owns.
 */
@Schema({ collection: 'session' })
export class Session {
  /** SHA-256 of the token in the cookie. */
  @Prop({ type: String, required: true, unique: true })
  hashedToken!: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  user!: Types.ObjectId;

  /** Kept so a future "active sessions" screen can describe each one. */
  @Prop({ type: String, required: false })
  ip?: string;

  @Prop({ type: String, required: false })
  userAgent?: string;

  @Prop({ type: Date, required: false, default: Date.now })
  dateCreated!: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

/**
 * Sweeps expired sessions. Mongo only runs the sweep about once a minute, so
 * readers check the age themselves rather than trusting a row's existence.
 */
SessionSchema.index({ dateCreated: 1 }, { expireAfterSeconds: SESSION_LIFETIME_SECONDS });
