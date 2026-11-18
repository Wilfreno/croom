'use client';
import useCreateConversation from '@/components/hooks/mutation/useCreateConversation.mutation';
import useOutgoingCall from '@/components/hooks/useOutgoingCall';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ConversationInfo } from '@/types/common.types';
import { ConversationStatus } from '@repo/enums';
import { Conversation } from '@repo/types';
import { useQueryClient } from '@tanstack/react-query';
import { Video } from 'lucide-react';
import ConversationAvatar from '../ConversationAvatar';
import UserAvatar from '../UserAvatar';
import OutgoingCallDialog from './OutgoingCallDialog';

export default function StartCallButton({
  conversationId,
  conversation,
  conversationInfo,
  newConversationMemberIds = [],
}: {
  conversationId?: string;
  conversation?: Conversation;
  conversationInfo?: ConversationInfo;
  newConversationMemberIds?: string[];
}) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const outgoingCall = useOutgoingCall();
  const { createConversation } = useCreateConversation();

  if (conversation?.status === ConversationStatus.BLOCKED) return null;

  async function startCall() {
    if (conversationId) {
      const recipientCount = conversation
        ? conversation.members.filter((member) => member.id !== session.user?.id).length
        : 1;
      await outgoingCall.start({ conversationId, recipientCount });
      return;
    }

    const createdConversation = await createConversation.mutateAsync(newConversationMemberIds).catch(() => null);
    if (!createdConversation) return;

    await outgoingCall.start({
      conversationId: createdConversation.id,
      recipientCount: newConversationMemberIds.length,
    });
    queryClient.invalidateQueries({ queryKey: ['conversation', 'members'] });
  }

  const callAvatar = conversation ? (
    <ConversationAvatar conversation={conversation} currentUserId={session.user?.id} size="lg" className="h-20 w-20" />
  ) : (
    <UserAvatar
      src={conversationInfo?.photoUrl}
      name={conversationInfo?.conversationName}
      isOnline={false}
      className="h-20 w-20"
    />
  );

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="aspect-square h-fit w-auto rounded-full p-1 text-primary hover:text-accent-none hover:scale-105"
              aria-label="Start video call"
              disabled={createConversation.isPending}
              onClick={startCall}
            >
              <Video className="fill-primary" />
            </Button>
          </TooltipTrigger>
        </Tooltip>
      </TooltipProvider>
      <OutgoingCallDialog
        status={outgoingCall.status}
        name={conversationInfo?.conversationName ?? ''}
        avatar={callAvatar}
        onCancel={outgoingCall.cancel}
        onClose={outgoingCall.close}
        onCallAgain={outgoingCall.callAgain}
      />
    </>
  );
}
