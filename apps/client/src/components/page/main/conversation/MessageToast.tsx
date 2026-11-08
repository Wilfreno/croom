import useSendMessage from '@/components/hooks/mutation/useSendMessage.mutation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn, getTimeIntervalText } from '@/lib/utils';
import { MessagePayload } from '@repo/types';
import { SendHorizontal, ThumbsUp, UserRound, X } from 'lucide-react';
import Image from 'next/image';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function MessageToast({ message, toastId }: { message: MessagePayload; toastId: string | number }) {
  const [textInput, setTextInput] = useState('');
  const { sendMessage } = useSendMessage(textInput);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const displayName = useMemo(() => {
    let name = message.conversation.nicknames.find((nickname) => nickname.user === message.sender.id)?.value;

    if (!name) name = message.sender.displayName;

    return name;
  }, [message]);

  return (
    <div className="rounded-lg w-full relative group">
      <div className="flex  border-b p-2">
        <div className="flex items-start gap-4">
          <Avatar>
            <AvatarImage src={message.sender.photo?.url} />
            <AvatarFallback>
              <UserRound className="h-1/2 w-auto" />
            </AvatarFallback>
          </Avatar>
          <div className="grid items-start w-full  overflow-y-auto">
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground flex">{getTimeIntervalText(message.dateCreated)}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="aspect-square h-fit w-auto p-1 absolute top-1 right-2"
          onClick={() => toast.dismiss(toastId)}
        >
          <X className="h-4 w-auto" />
        </Button>
      </div>
      <div className="flex items-start p-2 max-h-[20vw] overflow-y-auto">
        <span className="text-xs pl-1 text-start">
          {message.photos.length > 1 ? ' Sent some photos' : message.text}
        </span>
      </div>
      <div>
        {message.photos.length === 1 && (
          <div className="relative aspect-video w-full h-auto mt-2">
            <Image
              src={message.photos[0]?.url}
              height={message.photos[0]?.height}
              width={message.photos[0]?.width}
              className="object-cover w-full h-auto"
              alt=""
            />
          </div>
        )}
      </div>
      <div className="border-t flex items-end p-2">
        <Textarea
          disabled={sendMessage.isPending}
          className={cn(
            'resize-none h-auto max-h-[30dvh] min-h-2 shadow-none  overflow-y-auto  focus-visible:ring-0 border-none placeholder:font-medium scrollbar scrollbar-thumb-gray-300  scrollbar-track-background ',
          )}
          ref={textareaRef}
          placeholder="reply"
          rows={1}
          value={textInput}
          onChange={(e) => {
            setTextInput(e.currentTarget.value);
            e.currentTarget.style.height = 'auto';
            e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();

              if (!textInput.trim()) return;

              sendMessage.mutate({ text: '', conversationId: message.conversation.id, photoInput: [] });
            }
          }}
        />
        {Boolean(textInput) ? (
          <Button
            variant="ghost"
            disabled={!textInput || sendMessage.isPending}
            type="button"
            className="aspect-square h-fit w-auto p-1 mb-1"
            onClick={() => sendMessage.mutate({ text: '', conversationId: message.conversation.id, photoInput: [] })}
          >
            <SendHorizontal className="h-5 w-auto text-primary" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="aspect-square h-fit w-auto rounded-full p-2"
            onClick={() => {
              sendMessage.mutate({ text: '👍', conversationId: message.conversation.id, photoInput: [] });
            }}
          >
            <ThumbsUp className="h-5 w-auto text-primary" />
          </Button>
        )}
      </div>
    </div>
  );
}
