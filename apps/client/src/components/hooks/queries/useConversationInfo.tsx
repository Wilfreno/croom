import { useAuth } from '@/components/providers/AuthProvider';
import { isGroupChat } from '@/lib/utils';
import { Conversation } from '@/types/model.types';
import { UserStatus } from '@repo/enums';
import { useQuery } from '@tanstack/react-query';

export default function useConversationInfo(conversation?: Conversation) {
  const { session } = useAuth();

  const { data } = useQuery({
    enabled: Boolean(conversation) && Boolean(session.user),
    queryKey: ['conversation', 'info', conversation?._id],
    queryFn() {
      let lastOnline = '';
      let photoUrl: string;
      let conversationName = '';
      let status: UserStatus | null = null;

      if (isGroupChat(conversation!)) {
        photoUrl = conversation!.photo?.url || '';
        conversationName = conversation!.name;
      } else {
        const otherUser = conversation!.members.find((member) => member._id !== session.user?.id);
        if (!otherUser) return { photoUrl: '', conversationName: '', status: null, lastOnline };

        status = otherUser.status;
        photoUrl = otherUser.photo?.url || '';

        conversationName = conversation!.nicknames.find((nickname) => nickname.user === otherUser._id)!.value;
        if (!conversationName) conversationName = otherUser.displayName;

        if (otherUser.status === UserStatus.OFFLINE) {
          const lastOnlineDate = new Date(otherUser.lastOnline);
          const now = new Date();

          const lastOnlineInSeconds = Math.floor((now.getTime() - lastOnlineDate.getTime()) / 1000);
          const minutes = 60;
          const hour = 60 * 60;
          const day = 60 * 60 * 24;

          if (lastOnlineInSeconds > day) {
            lastOnline = Math.floor(lastOnlineInSeconds / day) + ' day(s) ago';
          } else if (lastOnlineInSeconds > hour && lastOnlineInSeconds < day) {
            lastOnline = Math.floor(lastOnlineInSeconds / hour) + ' hour(s) ago';
          } else if (lastOnlineInSeconds > minutes && lastOnlineInSeconds < hour) {
            lastOnline = Math.floor(lastOnlineInSeconds / minutes) + ' minute(s) ago';
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
