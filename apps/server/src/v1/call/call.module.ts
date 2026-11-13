import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConversationModel } from '@repo/models';
import { Conversation, ConversationSchema } from '@repo/schemas';
import { CallGateway } from './call.gateway';
import { CallService } from './call.service';
import { MediasoupService } from './mediasoup.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
    ]),
  ],
  providers: [CallGateway, CallService, MediasoupService, ConversationModel],
})
export class CallModule {}
