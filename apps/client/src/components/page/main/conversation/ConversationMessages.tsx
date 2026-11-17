import useSendMessage from '@/components/hooks/mutation/useSendMessage.mutation';
import useMessages from '@/components/hooks/queries/useMessages';
import { useAuth } from '@/components/providers/AuthProvider';
import { isBlockedMember, toPhotoInputs } from '@/lib/utils';
import type { CachedMessage } from '@/types/message.types';
import ConversationMessage from './ConversationMessage';
import { Conversation } from "@repo/types";

export default function ConversationMessages({ conversation }: { conversation?: Conversation }) {
  const { foundMessages } = useMessages([conversation!]);
  const { sendMessage } = useSendMessage('');
  const { session } = useAuth();
  const markSeen = !isBlockedMember(conversation, session.user?.id);

  function retry(message: CachedMessage) {
    sendMessage.mutate({
      conversationId: message.conversation,
      text: message.text,
      photoInput: toPhotoInputs(message.photos),
      retryId: message.id,
    });
  }

  return (
    <div className="h-full w-full max-h-[80dvh] flex flex-col px-1 overflow-y-auto scrollbar scrollbar-thumb-gray-300  scrollbar-track-background">
      <div className="mt-auto space-y-px">
        {foundMessages && Boolean(foundMessages.pages.length) &&
          foundMessages.pages.map((page, pagesIndex) =>
            page.result.map((message, messageIndex) => (
              <ConversationMessage
                key={message.clientKey ?? message.id}
                message={message}
                prevMessage={page.result[messageIndex - 1]}
                nextMessage={page.result[messageIndex + 1]}
                isLastMessage={pagesIndex === foundMessages.pages.length - 1 && messageIndex === page.result.length - 1}
                markSeen={markSeen}
                onRetry={retry}
              />
            )),
          )}
      </div>
    </div>
  );
}
