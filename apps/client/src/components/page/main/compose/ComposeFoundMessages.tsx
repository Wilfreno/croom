'use client';

import useComposeMessage from '@/components/hooks/mutation/useComposeMessage.mutation';
import useMessages from '@/components/hooks/queries/useMessages';
import useSearchConversationsByMembers from '@/components/hooks/queries/useSearchConversationsByMember';
import { Button } from '@/components/ui/button';
import { toPhotoInputs } from '@/lib/utils';
import type { CachedMessage } from '@/types/message.types';
import ConversationMessage from '../conversation/ConversationMessage';

export default function ComposeFoundMessages({ selectedUsers }: { selectedUsers: string[][] }) {
  const { foundConversations } = useSearchConversationsByMembers(selectedUsers);
  const { foundMessages, isError } = useMessages(foundConversations!);
  const { sendMessage } = useComposeMessage();

  function retry(message: CachedMessage) {
    sendMessage.mutate({
      conversationId: foundConversations?.[0]?.id,
      text: message.text,
      members: selectedUsers.map((user) => user[0]),
      photos: toPhotoInputs(message.photos),
      retryId: message.id,
    });
  }

  return (
    <div className="h-full w-full max-h-[80dvh] flex flex-col px-1 overflow-y-auto scrollbar scrollbar-thumb-gray-300  scrollbar-track-background">
      <div className="mt-auto space-y-px">
        {isError ? (
          <div>
            <p>Can&apos;t load messages</p>
            <Button>Reload</Button>
          </div>
        ) : (
          foundMessages?.pages.map((page, pagesIndex) =>
            page.result.map((message, messageIndex) => (
              <ConversationMessage
                key={message.clientKey ?? message.id}
                message={message}
                prevMessage={page.result[messageIndex - 1]}
                nextMessage={page.result[messageIndex + 1]}
                isLastMessage={pagesIndex === foundMessages.pages.length - 1 && messageIndex === page.result.length - 1}
                onRetry={retry}
              />
            )),
          )
        )}
      </div>
    </div>
  );
}
