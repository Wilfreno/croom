'use client';

import { UserStatus } from '@repo/enums';
import { Conversation } from '@repo/types';
import GroupAvatar from './GroupAvatar';
import UserAvatar from './UserAvatar';

export default function ConversationAvatar({
  conversation,
  currentUserId,
  className,
  size = 'default',
}: {
  conversation: Pick<Conversation, 'members' | 'photo' | 'isGroupChat'>;
  currentUserId?: string;
  className?: string;
  size?: 'default' | 'lg';
}) {
  if (conversation.isGroupChat)
    return <GroupAvatar conversation={conversation} currentUserId={currentUserId} className={className} size={size} />;

  const otherMember = conversation.members.find((member) => member.id !== currentUserId) ?? conversation.members[0];

  return (
    <UserAvatar
      src={otherMember?.photo?.url}
      name={otherMember?.displayName}
      colorKey={otherMember?.id}
      isOnline={otherMember?.status === UserStatus.ONLINE}
      className={className}
      onlineClassName={size === 'lg' ? 'h-8 bottom-1' : undefined}
    />
  );
}
