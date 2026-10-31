import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { PhotoType } from '@repo/enums';
import { ConversationModel, MessageModel, PhotoModel } from '@repo/models';
import { Connection, Types } from 'mongoose';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessageService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly conversationModel: ConversationModel,
    private readonly messageModel: MessageModel,
    private readonly photoModel: PhotoModel,
  ) {}

  async create({
    text,
    photos,
    conversationId,
    userId,
  }: CreateMessageDto & { userId: string }) {
    const foundConversation =
      await this.conversationModel.findConversationById(conversationId);

    if (!foundConversation)
      throw new NotFoundException('Conversation does not exist');

    const session = await this.connection.startSession();

    try {
      session.withTransaction(async () => {
        const newPhotoIds = await this.photoModel.createMany(
          photos.map((photo) => ({
            owner: new Types.ObjectId(userId),
            type: PhotoType.MESSAGE,
            url: photo.url,
            width: photo.width,
            height: photo.height,
          })),
          session,
        );
        await this.messageModel.createMessage(
          {
            conversation: new Types.ObjectId(conversationId),
            text,
            photos: newPhotoIds.map((photo) => photo._id),
            sender: userId,
          },
          session,
        );
      });
    } finally {
      await session.endSession();
    }
  }
}
