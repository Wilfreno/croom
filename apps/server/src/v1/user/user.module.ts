import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ConversationModel,
  PhotoModel,
  SessionModel,
  UserModel,
} from '@repo/models';
import {
  Conversation,
  ConversationSchema,
  Message,
  MessageSchema,
  Photo,
  PhotoSchema,
  Session,
  SessionSchema,
  User,
  UserSchema,
} from '@repo/schemas';
import { SocketSessionsModule } from '../../common/socket-sessions/socket-sessions.module';
import { UploadedFilesModule } from '../../common/uploaded-files/uploaded-files.module';
import { OtpModule } from '../otp/otp.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Photo.name, schema: PhotoSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
    OtpModule,
    SocketSessionsModule,
    UploadedFilesModule,
  ],
  controllers: [UserController],
  providers: [
    UserModel,
    ConversationModel,
    PhotoModel,
    SessionModel,
    UserService,
  ],
  exports: [UserService],
})
export class UserModule {}
