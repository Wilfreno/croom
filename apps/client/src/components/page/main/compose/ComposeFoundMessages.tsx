'use client';

import useMessages from '@/components/hooks/queries/useMessages';
import useSearchConversationsByMembers from '@/components/hooks/queries/useSearchConversationsByMember';
import { Button } from '@/components/ui/button';
import ConversationMessage from '../conversation/ConversationMessage';

export default function ComposeFoundMessages({ selectedUsers }: { selectedUsers: string[][] }) {
  const { foundConversations } = useSearchConversationsByMembers(selectedUsers);
  const { foundMessages, isError } = useMessages(foundConversations!);

  return (
    <div className="h-full w-full max-h-[80dvh] flex flex-col px-1 overflow-y-auto scrollbar scrollbar-thumb-gray-300  scrollbar-track-background">
      <div className="mt-auto space-y-px">
        {isError ? (
          <div>
            <p>Can't load messages</p>
            <Button>Reload</Button>
          </div>
        ) : (
          foundMessages?.pages.map((page, pagesIndex) =>
            page.result.map((message, messageIndex) => (
              <ConversationMessage
                key={message._id}
                message={message}
                prevMessage={page.result[messageIndex - 1]}
                nextMessage={page.result[messageIndex + 1]}
                isLastMessage={pagesIndex === foundMessages.pages.length - 1 && messageIndex === page.result.length - 1}
              />
            )),
          )
        )}
      </div>
    </div>
  );
}
