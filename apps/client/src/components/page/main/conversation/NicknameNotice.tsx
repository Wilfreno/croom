'use client';
import { useAuth } from '@/components/providers/AuthProvider';
import { getNicknameNoticeParts } from '@/lib/utils';
import type { Conversation, Message, MessageNotice } from '@repo/types';
import { PenLine } from 'lucide-react';
import NicknamesDialog from '../info/customization/NicknamesDialog';

export default function NicknameNotice({
  message,
  notice,
  conversation,
  canEdit,
}: {
  message: Pick<Message, 'sender'>;
  notice: MessageNotice;
  conversation?: Conversation;
  canEdit: boolean;
}) {
  const { session } = useAuth();

  const memberName = (id: string) => conversation?.members.find((member) => member.id === id)?.displayName;

  const { actor, target, value } = getNicknameNoticeParts({
    notice,
    actorId: message.sender.id,
    actorName: memberName(message.sender.id) ?? message.sender.displayName ?? 'Someone',
    targetName: memberName(notice.user) ?? 'someone',
    currentUserId: session.user?.id,
  });

  return (
    <div className="flex items-center justify-center gap-1 px-4 py-2 text-center text-xs text-muted-foreground">
      <span className="break-words">
        <span className="font-medium text-foreground">{actor}</span>
        {value ? (
          <>
            {` set ${target} nickname to `}
            <span className="font-medium text-foreground">{value}</span>
          </>
        ) : (
          ` cleared ${target} nickname`
        )}
      </span>
      {canEdit && (
        <NicknamesDialog
          editUserId={notice.user}
          trigger={
            <button
              type="button"
              aria-label="Edit nickname"
              className="shrink-0 rounded-full p-1 text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <PenLine className="h-3.5 w-auto" />
            </button>
          }
        />
      )}
    </div>
  );
}
