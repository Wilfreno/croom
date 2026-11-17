import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConversationModel, MessageModel, PhotoModel, UserModel } from '@repo/models';
import {
  Conversation,
  ConversationSchema,
  Message,
  MessageSchema,
  Photo,
  PhotoSchema,
  User,
  UserSchema,
} from '@repo/schemas';
import { CallModule } from '../call/call.module';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';

@Module({
  imports: [
    CallModule,
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: User.name, schema: UserSchema },
      { name: Photo.name, schema: PhotoSchema },
    ]),
  ],
  controllers: [ConversationController],
  providers: [ConversationService, ConversationModel, MessageModel, PhotoModel, UserModel],
  exports: [ConversationService],
})
export class ConversationModule {}
