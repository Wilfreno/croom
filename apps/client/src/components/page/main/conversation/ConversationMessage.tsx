'use client';
import { useAuth } from '@/components/providers/AuthProvider';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import InitialsFallback from '@/components/page/main/InitialsFallback';
import Loading from '@/components/svg/Loading';
import { axiosInstance } from '@/lib/axios-instance';
import { cn, getSecondsInterval, getTimeIntervalText, isBlockedError, isSameSender } from '@/lib/utils';
import type { CachedMessage } from '@/types/message.types';
import { SECONDS_IN_MINUTE } from '@repo/constants';
import { Conversation, Message } from '@repo/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import NicknameNotice from './NicknameNotice';
import { useEffect, useMemo, useRef } from 'react';

export default function ConversationMessage({
  message,
  prevMessage,
  nextMessage,
  isLastMessage,
  markSeen = true,
  onRetry,
  conversation,
  canEditNicknames = true,
}: {
  message: CachedMessage;
  prevMessage?: Message;
  nextMessage?: Message;
  isLastMessage: boolean;
  markSeen?: boolean;
  onRetry?: (message: CachedMessage) => void;
  conversation?: Conversation;
  canEditNicknames?: boolean;
}) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const divRef = useRef<HTMLDivElement>(null);

  const { showTimeInterval, timeIntervalText, quickMessagePlacement } = useMemo(() => {
    const dateSent = new Date(message.dateCreated);
    let quickMessagePlacement: 'FIRST' | 'MIDDLE' | 'LAST';
    let showTimeInterval = false;
    let timeIntervalText = '';

    if (isSameSender(nextMessage, message)) {
      const nextMessageDateSent = new Date(nextMessage.dateCreated);
      const nextMessageDateSentInSeconds = getSecondsInterval(nextMessageDateSent, dateSent);
      if (nextMessageDateSentInSeconds < SECONDS_IN_MINUTE) {
        if (isSameSender(prevMessage, message)) {
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

      if (isSameSender(prevMessage, message) && prevMessageDateSentInSeconds < SECONDS_IN_MINUTE) {
        if (isSameSender(nextMessage, message)) {
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
    let style = 'py-2 max-w-[80%] lg:max-w-[40dvw] break-words whitespace-pre-wrap';

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
          style += isSender ? ' rounded-tr-lg rounded-br' : ' rounded-tl-lg rounded-bl';
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

    if (Boolean(message.photos.length))
      style += isSender ? ' rounded-l-lg rounded-tr-lg rounded-br' : ' rounded-r-lg rounded-tl-lg rounded-bl';

    return style;
  }, [noText, session.user, quickMessagePlacement, message]);

  const photoStyle = useMemo(() => {
    let style = 'h-fit w-[60vw] sm:w-[40vw] lg:w-[25dvw] max-w-full rounded-sm overflow-hidden grid';
    style += message.sender.id === session.user?.id ? ' ml-auto' : ' mr-auto';

    if (Boolean(message.photos.length)) style += ' mt-px';
    if (message.photos.length > 1) style += ' bg-muted rounded-lg';
    else if (message.photos.length === 1) style += ' border shadow-sm';
    if (message.text)
      style +=
        message.sender.id === session.user?.id
          ? ' rounded-l-lg rounded-tr-sm rounded-br'
          : ' rounded-r-lg rounded-tl-lg rounded-bl';

    const gridCols = ['grid-cols-1', 'grid-cols-2', 'grid-cols-3'][getPhotoColumns(message.photos.length) - 1];
    if (gridCols) style += ' ' + gridCols;
    return style;
  }, [message, session.user]);

  const photoCornerStyles = useMemo(() => {
    const photoCount = message.photos.length;
    if (photoCount < 2) return [];
    return message.photos.map((_, index) => getPhotoCornerStyle(index, photoCount));
  }, [message.photos.length]);

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
    onError(error) {
      if (isBlockedError(error)) queryClient.invalidateQueries({ queryKey: ['conversation', message.conversation] });
    },
  });

  useEffect(() => {
    if (!isLastMessage) return;
    divRef.current?.scrollIntoView({ behavior: 'instant', block: 'nearest' });
  }, [isLastMessage, message.pending, message.failed]);

  useEffect(() => {
    if (!markSeen || !isLastMessage || message.pending || message.failed) return;
    seen.mutate();
  }, [markSeen, isLastMessage, message.pending, message.failed]);

  return (
    <span className="grid grid-cols-[minmax(0,1fr)] gap-3">
      {showTimeInterval && (
        <div key={message.id + 'time_interval'} className="mt-6 text-center text-xs text-muted-foreground font-medium">
          {timeIntervalText}
        </div>
      )}
      {message.notice ? (
        <div key={message.id} ref={divRef}>
          <NicknameNotice
            message={message}
            notice={message.notice}
            conversation={conversation}
            canEdit={canEditNicknames}
          />
        </div>
      ) : (
      <div
        key={message.id}
        ref={divRef}
        className={cn(
          'gap-2 w-full grid',
          message.sender.id === session.user?.id ? 'ml-auto grid-cols-[minmax(0,1fr)]' : 'grid-cols-[auto_minmax(0,1fr)] items-end',
        )}
      >
        {message.sender.id !== session.user?.id && (
          <Avatar className={cn(quickMessagePlacement && quickMessagePlacement !== 'LAST' && 'opacity-0')}>
            <AvatarImage src={message.sender.photo?.url} />
            <InitialsFallback name={message.sender.displayName} colorKey={message.sender.id} />
          </Avatar>
        )}
        <div
          className={cn(
            'grid min-w-0 grid-cols-[minmax(0,1fr)] transition-opacity duration-300',
            (message.pending || message.failed) && 'opacity-50',
            message.failed && onRetry && 'cursor-pointer',
          )}
          aria-busy={message.pending || undefined}
          onClick={message.failed && onRetry ? () => onRetry(message) : undefined}
        >
          {Boolean(message.text) && (
            <div className={cn(textStyle)}>
              <span>{message.text}</span>
            </div>
          )}
          <div className={photoStyle}>
            {message.photos.map((photo, index) => (
              <div key={photo.id} className={cn('relative w-full h-full overflow-hidden', photoCornerStyles[index])}>
                <Image
                  src={photo.url}
                  height={photo.height}
                  width={photo.width}
                  className={cn('object-cover w-full', message.photos.length > 1 ? 'aspect-square h-full' : 'h-auto')}
                  alt=""
                />
              </div>
            ))}
          </div>
        </div>
        {message.pending && message.resending && (
          <div
            role="status"
            className="-mt-1 flex items-center justify-end gap-1 text-xs font-medium text-muted-foreground"
          >
            <Loading className="h-4 fill-muted-foreground" />
            Resending
          </div>
        )}
        {message.failed && (
          <div role="alert" className="-mt-1 text-right text-xs font-medium text-destructive">
            Message not sent
            {onRetry && (
              <>
                {' · '}
                <button type="button" className="underline" onClick={() => onRetry(message)}>
                  Retry
                </button>
              </>
            )}
          </div>
        )}
      </div>
      )}
    </span>
  );
}

// 4 photos → 2x2; otherwise up to 3 per row (e.g. 7 → 3 + 3 + 1)
function getPhotoColumns(photoCount: number) {
  return photoCount === 4 ? 2 : Math.min(photoCount, 3);
}

// Round only the corners that sit on the outer edge of the photo group.
function getPhotoCornerStyle(index: number, photoCount: number) {
  const columns = getPhotoColumns(photoCount);
  const lastRowStart = Math.floor((photoCount - 1) / columns) * columns;
  const lastRowIsFull = photoCount - lastRowStart === columns;
  const corners: string[] = [];

  if (index === 0) corners.push('rounded-tl-md');
  if (index === columns - 1) corners.push('rounded-tr-md');
  if (index === lastRowStart) corners.push('rounded-bl-md');
  if (index === photoCount - 1) corners.push('rounded-br-md');
  // When the last row is short, the end of the row above also has an exposed bottom-right corner.
  if (!lastRowIsFull && index === lastRowStart - 1) corners.push('rounded-br-md');

  return corners.join(' ');
}
