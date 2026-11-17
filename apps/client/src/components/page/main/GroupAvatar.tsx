'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { cn, getGroupAvatarMembers, isConversationOnline } from '@/lib/utils';
import { UserStatus } from '@repo/enums';
import { Conversation } from '@repo/types';
import UserAvatar from './UserAvatar';

export default function GroupAvatar({
  conversation,
  currentUserId,
  className,
  size = 'default',
}: {
  conversation: Pick<Conversation, 'members' | 'photo'>;
  currentUserId?: string;
  className?: string;
  size?: 'default' | 'lg';
}) {
  const { session } = useAuth();
  const { shown, remainingCount } = getGroupAvatarMembers(conversation, currentUserId);
  const isLarge = size === 'lg';
  const onlineClassName = isLarge ? 'h-8 bottom-1' : undefined;
  const me = session.user;

  if (conversation.photo?.url)
    return (
      <UserAvatar
        src={conversation.photo.url}
        isOnline={isConversationOnline(conversation, currentUserId)}
        className={className}
        onlineClassName={onlineClassName}
      />
    );

  if (!shown)
    return (
      <UserAvatar
        src={me?.photo?.url}
        name={me?.displayName}
        colorKey={me?.id}
        isOnline={false}
        className={className}
      />
    );

  const hasOnlyOneOtherMember = remainingCount === 0;

  return (
    <div className="flex items-start h-fit w-fit">
      <UserAvatar
        src={shown?.photo?.url}
        name={shown?.displayName}
        colorKey={shown?.id}
        isOnline={shown?.status === UserStatus.ONLINE}
        className={className}
        onlineClassName={onlineClassName}
      />
      {remainingCount > 0 && (
        <span
          className={cn(
            'z-10 grid place-items-center aspect-square rounded-full border-2 border-muted bg-secondary font-semibold text-secondary-foreground',
            isLarge ? '-ml-8 h-12 min-w-12 px-2 text-sm' : '-ml-3 h-7 min-w-7 px-1 text-[10px]',
          )}
          aria-label={`and ${remainingCount} more`}
        >
          +{remainingCount}
        </span>
      )}
      {hasOnlyOneOtherMember && (
        <div
          className={cn('z-10 rounded-full border-2 border-muted', isLarge ? '-ml-8' : '-ml-3')}
          aria-label="and you"
        >
          <UserAvatar
            src={me?.photo?.url}
            name={me?.displayName}
            colorKey={me?.id}
            isOnline={false}
            className={isLarge ? 'h-12 w-12' : 'h-7 w-7'}
          />
        </div>
      )}
    </div>
  );
}
