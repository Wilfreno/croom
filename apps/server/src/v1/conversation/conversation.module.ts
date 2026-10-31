import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConversationModel, UserModel } from '@repo/models';
import {
  Conversation,
  ConversationSchema,
  User,
  UserSchema,
} from '@repo/schemas';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ConversationController],
  providers: [ConversationService, ConversationModel, UserModel],
})
export class ConversationModule {}
