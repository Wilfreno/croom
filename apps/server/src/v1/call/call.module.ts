import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConversationModel, MessageModel } from '@repo/models';
import {
  Conversation,
  ConversationSchema,
  Message,
  MessageSchema,
} from '@repo/schemas';
import { MessageGatewayModule } from '../message/message-gateway.module';
import { CallGateway } from './call.gateway';
import { CallNoticeService } from './call-notice.service';
import { CallService } from './call.service';
import { MediasoupService } from './mediasoup.service';

@Module({
  imports: [
    MessageGatewayModule,
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
  ],
  providers: [
    CallGateway,
    CallService,
    CallNoticeService,
    MediasoupService,
    ConversationModel,
    MessageModel,
  ],
  exports: [CallGateway],
})
export class CallModule {}
