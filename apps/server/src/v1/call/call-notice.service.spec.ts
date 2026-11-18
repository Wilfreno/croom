import { MessageNoticeType } from '@repo/enums';
import type { ConversationModel, MessageModel } from '@repo/models';
import type { CallMember } from '@repo/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MessageGateway } from '../message/message.gateway';
import { CallNoticeService } from './call-notice.service';

const CONVERSATION_ID = '64b7f0c2a1b2c3d4e5f60718';
const ALICE_ID = '64b7f0c2a1b2c3d4e5f60701';
const BOB_ID = '64b7f0c2a1b2c3d4e5f60702';
const NOTICE_ID = '64b7f0c2a1b2c3d4e5f60799';
const PAYLOAD = { id: NOTICE_ID };

function build(members: CallMember[] | null = [
  { id: ALICE_ID, displayName: 'Alice', photoUrl: null },
  { id: BOB_ID, displayName: 'Bob', photoUrl: null },
]) {
  const conversationModel = { getCallMembersByConversationId: vi.fn().mockResolvedValue(members) };
  const messageModel = {
    createMessage: vi.fn().mockResolvedValue({ _id: NOTICE_ID }),
    findMessagePayloadById: vi.fn().mockResolvedValue(PAYLOAD),
  };
  const messageGateway = { emitToUsers: vi.fn() };
  const service = new CallNoticeService(
    conversationModel as unknown as ConversationModel,
    messageModel as unknown as MessageModel,
    messageGateway as unknown as MessageGateway,
  );
  return { service, conversationModel, messageModel, messageGateway };
}

beforeEach(() => vi.clearAllMocks());

describe('CallNoticeService', () => {
  it('saves the notice from that person and sends it to every member, including them', async () => {
    const { service, messageModel, messageGateway } = build();

    await service.post({
      conversationId: CONVERSATION_ID,
      userId: ALICE_ID,
      type: MessageNoticeType.CALL_ENDED,
      value: '95',
    });

    const [saved] = messageModel.createMessage.mock.calls[0];
    expect(String(saved.conversation)).toBe(CONVERSATION_ID);
    expect(String(saved.sender)).toBe(ALICE_ID);
    expect(saved.notice.type).toBe(MessageNoticeType.CALL_ENDED);
    expect(String(saved.notice.user)).toBe(ALICE_ID);
    expect(saved.notice.value).toBe('95');
    expect(messageGateway.emitToUsers).toHaveBeenCalledWith([ALICE_ID, BOB_ID], 'MESSAGE', PAYLOAD);
  });

  it('leaves the value empty when there is none', async () => {
    const { service, messageModel } = build();

    await service.post({ conversationId: CONVERSATION_ID, userId: ALICE_ID, type: MessageNoticeType.CALL_RING });

    expect(messageModel.createMessage.mock.calls[0][0].notice.value).toBe('');
  });

  it('saves nothing for a conversation that does not exist', async () => {
    const { service, messageModel } = build(null);

    await service.post({ conversationId: CONVERSATION_ID, userId: ALICE_ID, type: MessageNoticeType.CALL_RING });

    expect(messageModel.createMessage).not.toHaveBeenCalled();
  });

  it('never lets a failure reach the call', async () => {
    const { service, messageModel, messageGateway } = build();
    messageModel.createMessage.mockRejectedValue(new Error('db down'));

    await expect(
      service.post({ conversationId: CONVERSATION_ID, userId: ALICE_ID, type: MessageNoticeType.CALL_RING }),
    ).resolves.toBeUndefined();
    expect(messageGateway.emitToUsers).not.toHaveBeenCalled();
  });
});
