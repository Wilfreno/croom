import type { AuthenticatedUser } from '@repo/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';

const USER = { id: 'me' } as AuthenticatedUser;

function build() {
  const messageService = {
    create: vi.fn().mockResolvedValue({ id: 'm1' }),
    updateMessage: vi.fn().mockResolvedValue(undefined),
  };
  const controller = new MessageController(messageService as unknown as MessageService);
  return { controller, messageService };
}

describe('MessageController', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends a message as the caller, passing only the fields it accepts', async () => {
    const { controller, messageService } = build();
    const body = { text: 'hi', photos: [], conversationId: 'c1', members: undefined, extra: 'x' };

    await expect(controller.create(USER, body as never)).resolves.toEqual({ id: 'm1' });
    expect(messageService.create).toHaveBeenCalledWith({
      text: 'hi',
      photos: [],
      conversationId: 'c1',
      members: undefined,
      userId: 'me',
    });
  });

  it('marks a message seen by the caller', async () => {
    const { controller, messageService } = build();

    await controller.updateMessage(USER, { messageId: 'm1', fieldName: 'seenBy' });

    expect(messageService.updateMessage).toHaveBeenCalledWith({
      userId: 'me',
      fieldName: 'seenBy',
      messageId: 'm1',
    });
  });
});
