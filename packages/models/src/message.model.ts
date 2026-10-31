import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Message } from '@repo/schemas';
import { ClientSession, Model } from 'mongoose';

@Injectable()
export class MessageModel {
  private readonly logger = new Logger(MessageModel.name);

  constructor(@InjectModel(MessageModel.name) private Message: Model<MessageModel>) {}

  async createMessage(data: Partial<Message>, session: ClientSession) {
    try {
      const newMessage = new this.Message(data, session);

      await newMessage.save({ session });

      return newMessage.toJSON();
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }
}
