import useMessages from '@/components/hooks/queries/useMessages';
import ConversationMessage from './ConversationMessage';
import { Conversation } from "@repo/types";

export default function ConversationMessages({ conversation }: { conversation?: Conversation }) {
  const { foundMessages } = useMessages([conversation!]);

  return (
    <div className="h-full w-full max-h-[80dvh] flex flex-col px-1 overflow-y-auto scrollbar scrollbar-thumb-gray-300  scrollbar-track-background">
      <div className="mt-auto space-y-px">
        {!!foundMessages?.pages.length &&
          foundMessages.pages.map((page, pagesIndex) =>
            page.result.map((message, messageIndex) => (
              <ConversationMessage
                key={message.id}
                message={message}
                prevMessage={page.result[messageIndex - 1]}
                nextMessage={page.result[messageIndex + 1]}
                isLastMessage={pagesIndex === foundMessages.pages.length - 1 && messageIndex === page.result.length - 1}
              />
            )),
          )}
      </div>
    </div>
  );
}
