'use client';
import { useAuth } from '@/components/providers/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { axiosInstance } from '@/lib/axios-instance';
import { cn, getSecondsInterval, getTimeIntervalText } from '@/lib/utils';
import { SECONDS_IN_MINUTE } from '@repo/constants';
import { Message } from '@repo/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserRound } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef } from 'react';

export default function ConversationMessage({
  message,
  prevMessage,
  nextMessage,
  isLastMessage,
}: {
  message: Message;
  prevMessage?: Message;
  nextMessage?: Message;
  isLastMessage: boolean;
}) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const divRef = useRef<HTMLDivElement>(null);

  const { showTimeInterval, timeIntervalText, quickMessagePlacement } = useMemo(() => {
    const dateSent = new Date(message.dateCreated);
    let quickMessagePlacement: 'FIRST' | 'MIDDLE' | 'LAST';
    let showTimeInterval = false;
    let timeIntervalText = '';

    if (!!nextMessage && nextMessage.sender.id === message.sender.id) {
      const nextMessageDateSent = new Date(nextMessage.dateCreated);
      const nextMessageDateSentInSeconds = getSecondsInterval(nextMessageDateSent, dateSent);
      if (nextMessageDateSentInSeconds < SECONDS_IN_MINUTE) {
        if (!!prevMessage && prevMessage.sender.id === message.sender.id) {
          const prevMessageDateSent = new Date(prevMessage.dateCreated);
          const prevMessageDateSentInSeconds = getSecondsInterval(dateSent, prevMessageDateSent);
          if (prevMessageDateSentInSeconds < SECONDS_IN_MINUTE) {
            quickMessagePlacement = 'MIDDLE';
          } else {
            quickMessagePlacement = 'FIRST';
          }
        }
      }
    }

    if (Boolean(prevMessage)) {
      const prevMessageDateSent = new Date(prevMessage!.dateCreated);
      const prevMessageDateSentInSeconds = getSecondsInterval(dateSent, prevMessageDateSent);

      if (prevMessage!.sender.id === message.sender.id && prevMessageDateSentInSeconds < SECONDS_IN_MINUTE) {
        if (!!nextMessage && nextMessage.sender.id === message.sender.id) {
          const nextMessageDateSent = new Date(nextMessage.dateCreated);
          const nextMessageDateSentInSeconds = getSecondsInterval(nextMessageDateSent, dateSent);
          if (nextMessageDateSentInSeconds < SECONDS_IN_MINUTE) {
            quickMessagePlacement = 'MIDDLE';
          } else {
            quickMessagePlacement = 'LAST';
          }
        } else {
          quickMessagePlacement = 'LAST';
        }
      }
      if (prevMessageDateSentInSeconds > SECONDS_IN_MINUTE) {
        showTimeInterval = true;
        timeIntervalText = getTimeIntervalText(message.dateCreated);
      }
    } else {
      showTimeInterval = true;
      timeIntervalText = getTimeIntervalText(message.dateCreated);
    }

    return {
      quickMessagePlacement: quickMessagePlacement!,
      showTimeInterval,
      timeIntervalText,
    };
  }, [message, prevMessage, nextMessage]);

  const noText = useMemo(() => {
    const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;
    const onlyEmoji =
      emojiRegex.test(message.text) &&
      message.text.split(/([\p{Emoji_Presentation}\p{Extended_Pictographic}])/u).filter(Boolean).length === 1;

    return onlyEmoji;
  }, [message.text]);

  const textStyle = useMemo(() => {
    let style = 'py-2 max-w-[40dvw] break-words whitespace-pre-wrap';

    const isSender = message.sender.id === session.user?.id;
    if (noText) style += ' h-fit text-4xl';
    else {
      style += ' rounded-lg px-4 text-sm shadow-sm border';
      if (isSender) style += ' bg-primary';
      else style += ' bg-secondary';
    }
    if (isSender) style += ' justify-self-end';
    else style += ' justify-self-start';

    if (Boolean(quickMessagePlacement)) {
      style += isSender ? ' rounded-l-lg' : ' rounded-r-lg';
      switch (quickMessagePlacement) {
        case 'FIRST': {
          style += isSender ? 'rounded-tr-lg rounded-br' : ' rounded-tl-lg rounded-bl';
          break;
        }
        case 'MIDDLE': {
          style += isSender ? '  rounded-r' : ' rounded-l';
          break;
        }
        case 'LAST': {
          style += isSender ? ' rounded-br-lg rounded-tr' : '  rounded-tl';
          if (!message.photos.length) style += ' rounded-bl-lg';
          break;
        }
      }
    }

    if (!!message.photos.length)
      style += isSender ? ' rounded-l-lg rounded-tr-lg rounded-br' : ' rounded-r-lg rounded-tl-lg rounded-bl';

    return style;
  }, [noText, session.user, quickMessagePlacement, message]);

  const photoStyle = useMemo(() => {
    let style = 'h-fit w-1/3 rounded-sm overflow-hidden grid ml-auto';

    if (!!message.photos.length) style += ' mt-px';
    if (message.photos.length > 1) style += ' bg-primary p-1';
    else if (message.photos.length === 1) style += ' border shadow-sm';
    if (message.text)
      style +=
        message.sender.id === session.user?.id
          ? ' rounded-l-lg rounded-tr-sm rounded-br'
          : ' rounded-r-lg rounded-tl-lg rounded-bl';

    style += ' grid-cols-' + Math.min(message.photos.length, 3);
    return style;
  }, [message]);

  const seen = useMutation({
    async mutationFn() {
      await axiosInstance.patch(`/message/${message.id}/seenBy`, {
        conversationId: message.conversation,
        action: 'ADD',
      });
    },
    onSuccess() {
      queryClient.invalidateQueries({
        exact: true,
        queryKey: [session.user?.id, 'conversations'],
      });
    },
  });

  useEffect(() => {
    if (!isLastMessage) return;
    divRef.current?.scrollIntoView({ behavior: 'instant', block: 'nearest' });
    seen.mutate();
  }, [isLastMessage]);

  return (
    <span className="grid gap-3">
      {showTimeInterval && (
        <div key={message.id + 'time_interval'} className="text-center text-xs text-muted-foreground font-medium">
          {timeIntervalText}
        </div>
      )}
      <div
        key={message.id}
        ref={divRef}
        className={cn(
          'gap-2 w-full grid',
          message.sender.id === session.user?.id ? 'ml-auto' : 'grid-cols-[auto_1fr] items-end',
        )}
      >
        {message.sender.id !== session.user?.id && (
          <Avatar className={cn(quickMessagePlacement && quickMessagePlacement !== 'LAST' && 'opacity-0')}>
            <AvatarImage src={message.sender.photo?.url} />
            <AvatarFallback>
              <UserRound className="h-1/2 w-auto" />
            </AvatarFallback>
          </Avatar>
        )}
        <div className="grid">
          {Boolean(message.text) && (
            <div className={cn(textStyle)}>
              <span>{message.text}</span>
            </div>
          )}
          <div className={photoStyle}>
            {message.photos.map((photo) => (
              <div key={photo.id} className="relative w-full h-full">
                <Image
                  src={photo.url}
                  height={photo.height}
                  width={photo.width}
                  className="object-cover w-full h-auto"
                  alt=""
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </span>
  );
}
