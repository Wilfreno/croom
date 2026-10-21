import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AuthServiceOptions, UserStatus } from '@repo/enums';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ collection: 'user' })
export class User {
  @Prop({ type: String, required: true })
  displayName!: string;

  @Prop({ type: String, required: true })
  userName!: string;

  /**
   * Left out of every query unless a caller asks for it by name. Only the login
   * path has any business reading the hash, so the field is opt-in rather than
   * something each new query has to remember to project away.
   */
  @Prop({ type: String, required: false, select: false })
  password?: string;

  @Prop({ type: String, required: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, unique: true })
  email!: string;

  /**
   * Set once an account has been through google. Sparse so the uniqueness rule
   * applies only to the accounts that have one -- without it every
   * password-only account would collide on a missing value.
   */
  @Prop({ type: String, required: false, unique: true, sparse: true })
  googleId?: string;

  /**
   * True only when a provider vouched for the address. What makes it safe to
   * match a returning google profile onto an existing account by email.
   */
  @Prop({ type: Boolean, required: false, default: false })
  emailVerified!: boolean;

  @Prop({ type: String, enum: UserStatus, required: false, default: UserStatus.OFFLINE })
  status!: UserStatus;

  @Prop({
    type: [String],
    enum: AuthServiceOptions,
    required: true,
    default: [AuthServiceOptions.WITH_EMAIL_AND_PASSWORD],
  })
  authService!: AuthServiceOptions[];

  @Prop({ type: Date, required: false, default: Date.now })
  lastOnline!: Date;

  @Prop({ type: Date, required: false, default: Date.now })
  dateCreated!: Date;

  @Prop({ type: Date, required: false, default: Date.now })
  lastUpdated!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
