import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConversationModel, MessageModel, PhotoModel } from '@repo/models';
import {
  Conversation,
  ConversationSchema,
  Message,
  MessageSchema,
  Photo,
  PhotoSchema,
} from '@repo/schemas';
import {
  ConversationBlockedGuard,
  ConversationMemberGuard,
} from '@repo/guards';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { MessageGateway } from './message.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Photo.name, schema: PhotoSchema },
    ]),
  ],
  controllers: [MessageController],
  providers: [
    MessageService,
    MessageGateway,
    ConversationModel,
    MessageModel,
    PhotoModel,
    ConversationMemberGuard,
    ConversationBlockedGuard,
  ],
})
export class MessageModule {}
