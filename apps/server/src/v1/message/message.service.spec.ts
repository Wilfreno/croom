import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PhotoType } from '@repo/enums';
import { ConversationModel, MessageModel, PhotoModel } from '@repo/models';
import { RESPONSE_PAYLOAD } from '@repo/types';
import { Connection, Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConversationService } from '../conversation/conversation.service';
import { MessageGateway } from './message.gateway';
import { MessageService } from './message.service';

const ME = '64b7f0c2a1b2c3d4e5f60701';
const ADA = '64b7f0c2a1b2c3d4e5f60702';
const BOB = '64b7f0c2a1b2c3d4e5f60703';
const CONVERSATION_ID = '64b7f0c2a1b2c3d4e5f60710';
const MESSAGE_ID = new Types.ObjectId();

const photo = { key: 'k1', url: 'https://utfs.io/k1.png', width: 640, height: 480 };

function build() {
  const order: string[] = [];
  const session = {
    withTransaction: vi.fn(async (work: () => Promise<unknown>) => {
      order.push('transaction');
      return work();
    }),
    endSession: vi.fn(async () => void order.push('endSession')),
  };
  const connection = { startSession: vi.fn().mockResolvedValue(session) };
  const conversation = {
    _id: new Types.ObjectId(CONVERSATION_ID),
    members: [ME, ADA, BOB].map((id) => new Types.ObjectId(id)),
  };
  const conversationModel = { findConversationById: vi.fn().mockResolvedValue(conversation) };
  const messageModel = {
    createMessage: vi.fn().mockResolvedValue({ _id: MESSAGE_ID }),
    findMessagePayloadById: vi.fn().mockResolvedValue({ id: MESSAGE_ID.toString(), text: 'hi' }),
    checkMessageAvailability: vi.fn().mockResolvedValue({ seenBy: [] }),
    updateMessage: vi.fn().mockResolvedValue(undefined),
  };
  const photoModel = {
    createMany: vi.fn(async (photos: object[], _session: unknown) => photos.map(() => ({ _id: new Types.ObjectId() }))),
  };
  const messageGateway = { emitToUsers: vi.fn() };
  const conversationService = {
    create: vi.fn().mockResolvedValue({
      _id: new Types.ObjectId(),
      members: [ADA, ME].map((id) => new Types.ObjectId(id)),
    }),
  };

  const service = new MessageService(
    connection as unknown as Connection,
    conversationModel as unknown as ConversationModel,
    messageModel as unknown as MessageModel,
    photoModel as unknown as PhotoModel,
    messageGateway as unknown as MessageGateway,
    conversationService as unknown as ConversationService,
  );

  return {
    service,
    order,
    session,
    connection,
    conversation,
    conversationModel,
    messageModel,
    photoModel,
    messageGateway,
    conversationService,
  };
}

describe('MessageService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('create', () => {
    const reply = { text: 'hi', photos: [], conversationId: CONVERSATION_ID, userId: ME };

    it('refuses a conversation that does not exist, before opening a transaction', async () => {
      const mocks = build();
      mocks.conversationModel.findConversationById.mockResolvedValue(null);

      await expect(mocks.service.create(reply)).rejects.toBeInstanceOf(NotFoundException);
      expect(mocks.connection.startSession).not.toHaveBeenCalled();
    });

    it('saves the message in an existing conversation inside the transaction', async () => {
      const mocks = build();

      await mocks.service.create(reply);

      expect(mocks.conversationService.create).not.toHaveBeenCalled();
      expect(mocks.messageModel.createMessage).toHaveBeenCalledWith(
        {
          conversation: mocks.conversation._id,
          text: 'hi',
          photos: [],
          sender: new Types.ObjectId(ME),
        },
        mocks.session,
      );
      expect(mocks.order).toEqual(['transaction', 'endSession']);
    });

    it('stores the photos as message photos owned by the sender and links them', async () => {
      const mocks = build();

      await mocks.service.create({ ...reply, photos: [photo] });

      const [photos, session] = mocks.photoModel.createMany.mock.calls[0];
      expect(session).toBe(mocks.session);
      expect(photos).toEqual([{ owner: new Types.ObjectId(ME), type: PhotoType.MESSAGE, ...photo }]);
      const created = await mocks.photoModel.createMany.mock.results[0].value;
      expect(mocks.messageModel.createMessage.mock.calls[0][0].photos).toEqual([created[0]._id]);
    });

    it('creates the conversation with the first message, adding the sender to its members', async () => {
      const mocks = build();

      await mocks.service.create({ text: 'hi', photos: [], members: [ADA], userId: ME });

      expect(mocks.conversationModel.findConversationById).not.toHaveBeenCalled();
      expect(mocks.conversationService.create).toHaveBeenCalledWith({ members: [ADA, ME], userId: ME }, mocks.session);
    });

    it('sends the message to every member but the sender and returns it', async () => {
      const mocks = build();

      await expect(mocks.service.create(reply)).resolves.toEqual({ id: MESSAGE_ID.toString(), text: 'hi' });

      expect(mocks.messageModel.findMessagePayloadById).toHaveBeenCalledWith(MESSAGE_ID);
      expect(mocks.messageGateway.emitToUsers).toHaveBeenCalledWith([ADA, BOB], 'MESSAGE', {
        id: MESSAGE_ID.toString(),
        text: 'hi',
      });
    });

    it('ends the session even when the transaction fails, and sends nothing', async () => {
      const mocks = build();
      mocks.messageModel.createMessage.mockRejectedValue(new Error('write conflict'));

      await expect(mocks.service.create(reply)).rejects.toThrow('write conflict');
      expect(mocks.session.endSession).toHaveBeenCalled();
      expect(mocks.messageGateway.emitToUsers).not.toHaveBeenCalled();
    });

    it('fails loudly when the saved message cannot be read back', async () => {
      const mocks = build();
      mocks.messageModel.findMessagePayloadById.mockResolvedValue(null);

      await expect(mocks.service.create(reply)).rejects.toBeInstanceOf(InternalServerErrorException);
      expect(mocks.messageGateway.emitToUsers).not.toHaveBeenCalled();
    });
  });

  describe('updateMessage', () => {
    const MESSAGE = '64b7f0c2a1b2c3d4e5f60720';

    it('adds the caller to seenBy without duplicating them', async () => {
      const mocks = build();

      await expect(
        mocks.service.updateMessage({ fieldName: 'seenBy', messageId: MESSAGE, userId: ME }),
      ).resolves.toBeUndefined();

      expect(mocks.messageModel.checkMessageAvailability).toHaveBeenCalledWith(MESSAGE);
      expect(mocks.messageModel.updateMessage).toHaveBeenCalledWith(MESSAGE, {
        $addToSet: { seenBy: new Types.ObjectId(ME) },
      });
    });

    it('answers "Already seen" without writing when the caller has seen it', async () => {
      const mocks = build();
      mocks.messageModel.checkMessageAvailability.mockResolvedValue({ seenBy: [new Types.ObjectId(ME)] });

      await expect(
        mocks.service.updateMessage({ fieldName: 'seenBy', messageId: MESSAGE, userId: ME }),
      ).resolves.toEqual({ [RESPONSE_PAYLOAD]: true, status: undefined, message: 'Already seen', data: null });
      expect(mocks.messageModel.updateMessage).not.toHaveBeenCalled();
    });

    it('refuses any other field', async () => {
      const mocks = build();

      await expect(
        mocks.service.updateMessage({ fieldName: 'text' as never, messageId: MESSAGE, userId: ME }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.messageModel.updateMessage).not.toHaveBeenCalled();
    });
  });
});
