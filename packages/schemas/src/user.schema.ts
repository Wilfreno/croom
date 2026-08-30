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

  @Prop({ type: String, required: false })
  password?: string;

  @Prop({ type: String, required: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, unique: true })
  email!: string;

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
