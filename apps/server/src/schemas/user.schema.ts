import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AuthServiceOptions, UserStatus } from '@repo/enums';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<UserSchema>;

@Schema({ collection: 'user' })
export class UserSchema {
  @Prop({ type: String, required: true })
  display_name!: string;

  @Prop({ type: String, required: true })
  username!: string;

  @Prop({ type: String, required: false })
  password?: string;

  @Prop({ type: String, required: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ })
  email!: string;

  @Prop({ type: UserStatus, enum: UserStatus, required: false })
  status!: UserStatus;

  @Prop({
    type: [AuthServiceOptions],
    enum: UserStatus,
    required: true,
    default: AuthServiceOptions.WITH_EMAIL_AND_PASSWORD,
  })
  auth_service!: AuthServiceOptions[];

  @Prop({ type: Date, required: false, default: Date.now })
  last_online!: Date;

  @Prop({ type: Date, required: false, default: Date.now })
  date_created!: Date;

  @Prop({ type: Date, required: false, default: Date.now })
  last_updated!: Date;
}

export const CatSchema = SchemaFactory.createForClass(UserSchema);
