import { useAuth } from '@/components/providers/AuthProvider';
import { getConversationName, getSecondsInterval, isConversationOnline, isGroupChat } from '@/lib/utils';
import { SECONDS_IN_DAY, SECONDS_IN_HOUR, SECONDS_IN_MINUTE } from '@repo/constants';
import { UserStatus } from '@repo/enums';
import { Conversation } from '@repo/types';
import { useQuery } from '@tanstack/react-query';

export default function useConversationInfo(conversation?: Conversation) {
  const { session } = useAuth();

  const { data } = useQuery({
    enabled: Boolean(conversation) && Boolean(session.user),
    queryKey: ['conversation', 'info', conversation?.id],
    queryFn() {
      let lastOnline = '';
      let photoUrl: string;
      const conversationName = getConversationName(conversation!, session.user?.id);
      let status: UserStatus | null = null;
      const isOnline = isConversationOnline(conversation!, session.user?.id);

      if (isGroupChat(conversation!)) {
        photoUrl = conversation!.photo?.url || '';
      } else {
        const otherUser = conversation!.members.find((member) => member.id !== session.user?.id);
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
    },
    placeholderData: {
      photoUrl: undefined!,
      conversationName: '',
      status: null,
      isOnline: false,
      lastOnline: '',
    },
  });

  return { data };
}
