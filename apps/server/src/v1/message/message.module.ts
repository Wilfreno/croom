import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConversationModel } from '@repo/models';
import { Conversation, ConversationSchema } from '@repo/schemas';
import {
  ConversationBlockedGuard,
  ConversationMemberGuard,
} from '@repo/guards';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
    ]),
  ],
  controllers: [MessageController],
  providers: [
    MessageService,
    ConversationModel,
    ConversationMemberGuard,
    ConversationBlockedGuard,
  ],
})
export class MessageModule {}
