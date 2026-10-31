import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { PhotoType } from '@repo/enums';
import { ConversationModel, MessageModel, PhotoModel } from '@repo/models';
import { Connection, Types } from 'mongoose';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageGateway } from './message.gateway';

@Injectable()
export class MessageService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly conversationModel: ConversationModel,
    private readonly messageModel: MessageModel,
    private readonly photoModel: PhotoModel,
    private readonly messageGateway: MessageGateway,
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
    let newMessage: Awaited<ReturnType<MessageModel['createMessage']>>;

    try {
      await session.withTransaction(async () => {
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
        newMessage = await this.messageModel.createMessage(
          {
            conversation: new Types.ObjectId(conversationId),
            text,
            photos: newPhotoIds.map((photo) => photo._id),
            sender: new Types.ObjectId(userId),
          },
          session,
        );
      });
    } finally {
      await session.endSession();
    }

    // Read after the commit, so recipients get the sender and photos populated.
    const messagePayload = await this.messageModel.findMessagePayloadById(
      newMessage!._id,
    );

    if (!messagePayload)
      throw new InternalServerErrorException('Message was not saved');

    const recipientIds = foundConversation.members
      .map((member) => member.toString())
      .filter((memberId) => memberId !== userId);

    this.messageGateway.emitToUsers(recipientIds, 'MESSAGE', messagePayload);

    return messagePayload;
  }
}
