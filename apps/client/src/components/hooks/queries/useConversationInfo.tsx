import { useAuth } from '@/components/providers/AuthProvider';
import { getConversationName, getSecondsInterval, isConversationOnline } from '@/lib/utils';
import { SECONDS_IN_DAY, SECONDS_IN_HOUR, SECONDS_IN_MINUTE } from '@repo/constants';
import { UserStatus } from '@repo/enums';
import { Conversation } from '@repo/types';
import { useMemo } from 'react';

const emptyInfo = {
  photoUrl: undefined!,
  conversationName: '',
  status: null,
  isOnline: false,
  lastOnline: '',
};

export default function useConversationInfo(conversation?: Conversation) {
  const { session } = useAuth();
  const userId = session.user?.id;

  const data = useMemo(() => {
    if (!conversation || !session.user) return emptyInfo;

    let lastOnline = '';
    let photoUrl: string;
    const conversationName = getConversationName(conversation, userId);
    let status: UserStatus | null = null;
    const isOnline = isConversationOnline(conversation, userId);

    if (conversation.isGroupChat) {
      photoUrl = conversation.photo?.url || '';
    } else {
      const otherUser = conversation.members.find((member) => member.id !== userId);
      if (!otherUser) return { photoUrl: '', conversationName: '', status: null, isOnline: false, lastOnline };

      status = otherUser.status;
      photoUrl = otherUser.photo?.url || '';

      if (otherUser.status === UserStatus.OFFLINE) {
        const lastOnlineInSeconds = getSecondsInterval(new Date(), new Date(otherUser.lastOnline));
        if (lastOnlineInSeconds > SECONDS_IN_DAY) {
          lastOnline = Math.floor(lastOnlineInSeconds / SECONDS_IN_DAY) + ' day(s) ago';
        } else if (lastOnlineInSeconds > SECONDS_IN_HOUR && lastOnlineInSeconds < SECONDS_IN_DAY) {
          lastOnline = Math.floor(lastOnlineInSeconds / SECONDS_IN_HOUR) + ' hour(s) ago';
        } else if (lastOnlineInSeconds > SECONDS_IN_MINUTE && lastOnlineInSeconds < SECONDS_IN_HOUR) {
          lastOnline = Math.floor(lastOnlineInSeconds / SECONDS_IN_MINUTE) + ' minute(s) ago';
        } else {
          lastOnline = lastOnlineInSeconds + ' second(s) ago';
        }
      }
    }

    return {
      photoUrl,
      conversationName,
      status,
      isOnline,
      lastOnline,
    };
  }, [conversation, session.user, userId]);

  return { data };
}
