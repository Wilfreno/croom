'use client';
import { useAuth } from '@/components/providers/AuthProvider';
import { getCallNoticeText } from '@/lib/utils';
import { MessageNoticeType } from '@repo/enums';
import type { Conversation, Message, MessageNotice } from '@repo/types';
import { type LucideIcon, PhoneMissed, Video, VideoOff } from 'lucide-react';

export default function CallNotice({
  message,
  notice,
  conversation,
}: {
  message: Pick<Message, 'sender'>;
  notice: MessageNotice;
  conversation?: Conversation;
}) {
  const { session } = useAuth();
  const sender = conversation?.members.find((member) => member.id === message.sender.id);
  const icons: Partial<Record<MessageNoticeType, LucideIcon>> = {
    [MessageNoticeType.CALL_ENDED]: VideoOff,
    [MessageNoticeType.CALL_MISSED]: PhoneMissed,
  };
  const Icon = icons[notice.type] ?? Video;

  return (
    <div className="flex items-center justify-center gap-1.5 px-4 py-2 text-center text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>
        {getCallNoticeText({
          notice,
          actorId: message.sender.id,
          actorName: sender?.displayName ?? message.sender.displayName ?? 'Someone',
          currentUserId: session.user?.id,
        })}
      </span>
    </div>
  );
}
