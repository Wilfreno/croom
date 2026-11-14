'use client';

import { getGroupAvatarMembers } from '@/lib/utils';
import { UserStatus } from '@repo/enums';
import { Conversation } from '@repo/types';
import UserAvatar from './UserAvatar';

/** A compact avatar for a group chat: one member (online first) and a "+N" bubble for the rest. */
export default function GroupAvatar({
  conversation,
  currentUserId,
  className,
}: {
  conversation: Pick<Conversation, 'members'>;
  currentUserId?: string;
  className?: string;
}) {
  const { shown, remainingCount } = getGroupAvatarMembers(conversation, currentUserId);

  return (
    <div className="flex items-end h-fit w-fit">
      <UserAvatar src={shown?.photo?.url} isOnline={shown?.status === UserStatus.ONLINE} className={className} />
      {remainingCount > 0 && (
        <span
          className="-ml-3 z-10 grid place-items-center aspect-square h-7 min-w-7 px-1 rounded-full border-2 border-muted bg-secondary text-[10px] font-semibold text-secondary-foreground"
          aria-label={`and ${remainingCount} more`}
        >
          +{remainingCount}
        </span>
      )}
    </div>
  );
}
