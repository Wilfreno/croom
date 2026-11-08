import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { PhotoType } from '@repo/enums';
import { ConversationModel, MessageModel, PhotoModel } from '@repo/models';
import { Message } from '@repo/schemas';
import { Connection, Types, UpdateQuery } from 'mongoose';
import { respond } from 'src/common/utils/server-response.util';
import { CreateMessageDto } from './dto/create-message.dto';
import { SeenByDto } from './dto/seenby.dto';
import { ConversationService } from '../conversation/conversation.service';
import { MessageGateway } from './message.gateway';

@Injectable()
export class MessageService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly conversationModel: ConversationModel,
    private readonly messageModel: MessageModel,
    private readonly photoModel: PhotoModel,
    private readonly messageGateway: MessageGateway,
    private readonly conversationService: ConversationService,
  ) {}

  async create({
    text,
    photos,
    conversationId,
    members,
    userId,
  }: CreateMessageDto & { userId: string }) {
    const foundConversation = conversationId
      ? await this.conversationModel.findConversationById(conversationId)
      : null;

    if (conversationId && !foundConversation)
      throw new NotFoundException('Conversation does not exist');

    const session = await this.connection.startSession();
    let newMessage: Awaited<ReturnType<MessageModel['createMessage']>>;
    let conversationMemberIds: string[];

    try {
      await session.withTransaction(async () => {
        const conversation =
          foundConversation ??
          (await this.conversationService.create(
            { members: [...members!, userId], userId },
            session,
          ));

        conversationMemberIds = conversation.members.map((member) =>
          member.toString(),
        );

        const newPhotoIds = await this.photoModel.createMany(
          photos.map((photo) => ({
            owner: new Types.ObjectId(userId),
            type: PhotoType.MESSAGE,
            key: photo.key,
            url: photo.url,
            width: photo.width,
            height: photo.height,
          })),
          session,
        );
        newMessage = await this.messageModel.createMessage(
          {
            conversation: conversation._id,
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

    const messagePayload = await this.messageModel.findMessagePayloadById(
      newMessage!._id,
    );

    if (!messagePayload)
      throw new InternalServerErrorException('Message was not saved');

    const recipientIds = conversationMemberIds!.filter(
      (memberId) => memberId !== userId,
    );

    this.messageGateway.emitToUsers(recipientIds, 'MESSAGE', messagePayload);

    return messagePayload;
  }

  async updateMessage({
    fieldName,
    messageId,
    userId,
  }: SeenByDto & { userId: string }) {
    const foundMessage =
      await this.messageModel.checkMessageAvailability(messageId);

    let update: UpdateQuery<Message>;
    switch (fieldName) {
      case 'seenBy': {
        if (foundMessage.seenBy.some((id) => id.toString() === userId))
          return respond(null, { message: 'Already seen' });
        update = {
          $addToSet: {
            seenBy: new Types.ObjectId(userId),
          },
        };
        break;
      }

      default:
        throw new BadRequestException(
          'fieldName should be a key of Message schema',
        );
    }

    await this.messageModel.updateMessage(messageId, update);
  }
}
