import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConversationModel, UserModel } from '@repo/models';
import {
  Conversation,
  ConversationSchema,
  Photo,
  PhotoSchema,
  User,
  UserSchema,
} from '@repo/schemas';
import { OtpModule } from '../otp/otp.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Photo.name, schema: PhotoSchema },
      { name: Conversation.name, schema: ConversationSchema },
    ]),
    OtpModule,
  ],
  controllers: [UserController],
  providers: [UserModel, ConversationModel, UserService],
  exports: [UserService],
})
export class UserModule {}
