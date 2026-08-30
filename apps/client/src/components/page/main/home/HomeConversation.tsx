'use client';
import { useAuth } from '@/components/providers/AuthProvider';
import { cn } from '@/lib/utils';
import { Conversation } from '@repo/types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import UserAvatar from '../UserAvatar';

export default function HomeConversation({ convo }: { convo: Conversation }) {
  const { session } = useAuth();
  const pathname = usePathname();

  const { conversationName, photoUrl, seen, timeIntervalText, isOnline } = useMemo(() => {
    let conversationName = '';
    let photoUrl: string;
    let seen: boolean;
    let timeIntervalText = '';
    let isOnline = false;

    if (!session)
      return {
        conversationName,
        photoUrl: photoUrl!,
        seen: seen!,
        timeIntervalText,
        isOnline: isOnline!,
      };

    if (convo.isGroupChat) {
      conversationName = convo.name;
      photoUrl = convo.photo?.url;
    } else {
      const otherUser = convo.members[0];

      photoUrl = otherUser?.photo!.url;

      conversationName = convo.nicknames.find((nickname) => nickname.user === otherUser?.id)?.value || '';

      if (!conversationName) conversationName = otherUser?.displayName;
    }

    if (session.user?.id === convo.messages[0].sender.id) {
      seen = true;
    } else {
      seen = convo.messages[0]?.seenBy.some((user) => user.id === session.user?.id);
    }
    isOnline = convo.members.some((user) => user.status === 'ONLINE');

    const dateSent = new Date(convo.messages[0].dateCreated);
    const now = new Date();
    const relativeDateInSeconds = Math.floor((now.getTime() - dateSent.getTime()) / 1000);

    const day = 60 * 60 * 24;

    if (relativeDateInSeconds < day) {
      timeIntervalText +=
        ' ' +
        new Intl.DateTimeFormat('en-US', {
          minute: '2-digit',
          hour: '2-digit',
        }).format(dateSent);
    } else {
      timeIntervalText += Math.floor(relativeDateInSeconds / day) + ' d';
    }

    return {
      conversationName,
      photoUrl,
      seen: seen!,
      timeIntervalText,
      isOnline,
    };
  }, [session, convo]);

  const textMessage = useMemo(() => {
    if (!convo || !session.user) return;
    let name = '';
    let text = '';

    if (convo.isGroupChat) {
      name = convo.nicknames.find((nickname) => nickname.user === convo.messages[0].sender.id)?.value || '';

      if (!name) name = convo.messages[0].sender.displayName;
    } else if (convo.messages[0].sender.id === session.user.id) name += 'you';

    text += name;

    if (!!convo.messages[0].photos.length) {
      if (convo.messages[0].photos.length > 1) text += ' sent some photos';
      else text += ' sent a photo';
    } else {
      if (convo.messages[0].sender.id === session.user.id) {
        text += ': ';
      }
      text += convo.messages[0].text;
    }
    return text;
  }, [convo, session.user]);

  return (
    <Link
      key={convo.id}
      className={cn(
        'flex items-center justify-start gap-2 w-full h-fit p-2  rounded-sm relative hover:bg-muted cursor-pointer',
        pathname.startsWith('/conversation/' + convo.id) && 'bg-muted',
      )}
      href={'/conversation/' + convo.id}
    >
      {!seen && <span className="absolute top-1 right-1 aspect-square h-4 w-auto bg-primary rounded-full"></span>}
      <UserAvatar src={photoUrl} isOnline={isOnline} />
      <div className="flex flex-col items-start justify-start w-full">
        <span className="font-semibold truncate max-w-60">{conversationName}</span>
        <div
          className={cn(
            'flex items-center justify-between text-xs w-full',
            seen ? 'text-muted-foreground' : 'font-semibold',
          )}
        >
          <p className="truncate  max-w-56">{textMessage}</p>
          <p>{timeIntervalText}</p>
        </div>
      </div>
    </Link>
  );
}
