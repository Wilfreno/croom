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
  ConversationFirstMessageGuard,
  ConversationMemberGuard,
} from '@repo/guards';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { MessageGatewayModule } from './message-gateway.module';
import { ConversationModule } from '../conversation/conversation.module';

@Module({
  imports: [
    MessageGatewayModule,
    ConversationModule,
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Photo.name, schema: PhotoSchema },
    ]),
  ],
  controllers: [MessageController],
  providers: [
    MessageService,
    ConversationModel,
    MessageModel,
    PhotoModel,
    ConversationMemberGuard,
    ConversationBlockedGuard,
    ConversationFirstMessageGuard,
  ],
})
export class MessageModule {}
