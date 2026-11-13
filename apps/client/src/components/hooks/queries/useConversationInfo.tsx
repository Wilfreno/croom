import { useAuth } from '@/components/providers/AuthProvider';
import { getSecondsInterval, isGroupChat } from '@/lib/utils';
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
      let conversationName = '';
      let status: UserStatus | null = null;

      if (isGroupChat(conversation!)) {
        photoUrl = conversation!.photo?.url || '';
        conversationName = conversation!.name;
      } else {
        const otherUser = conversation!.members.find((member) => member.id !== session.user?.id);
        if (!otherUser) return { photoUrl: '', conversationName: '', status: null, lastOnline };

        status = otherUser.status;
        photoUrl = otherUser.photo?.url || '';

        conversationName = conversation!.nicknames.find((nickname) => nickname.user === otherUser.id)?.value ?? '';
        if (!conversationName) conversationName = otherUser.displayName;

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
        lastOnline,
      };
    },
    placeholderData: {
      photoUrl: undefined!,
      conversationName: '',
      status: null,
      lastOnline: '',
    },
  });

  return { data };
}
