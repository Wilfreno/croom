'use client';

import useInfoSidebarOpen from '@/components/hooks/queries/useInfoSidebarOpen';
import useOutgoingCall from '@/components/hooks/useOutgoingCall';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ConversationInfo } from '@/types/common.types';
import { ConversationStatus } from '@repo/enums';
import { Conversation } from '@repo/types';
import { ArrowLeft, Ellipsis, Video } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import ConversationAvatar from '../ConversationAvatar';
import UserAvatar from '../UserAvatar';
import OutgoingCallDialog from './OutgoingCallDialog';

export default function ConversationHeader({
  conversationInfo,
  conversation,
}: {
  conversationInfo: ConversationInfo;
  conversation?: Conversation;
}) {
  const { session } = useAuth();
  const { onMobile, setIsOpen } = useInfoSidebarOpen();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const recipientCount = conversation
    ? conversation.members.filter((member) => member.id !== session.user?.id).length
    : 1;
  const outgoingCall = useOutgoingCall(params.id, recipientCount);
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
    <section
      className={cn(
        'w-full border-b flex items-center justify-between  relative gap-4  shadow-lg h-full',
        onMobile ? 'p-2' : 'p-3',
      )}
    >
      <div className="flex items-center gap-4 min-w-0">
        <Button variant="ghost" className="aspect-square h-fit w-auto p-1 lg:hidden" onClick={() => router.push('/')}>
          <ArrowLeft className="h-4 w-auto" />
        </Button>
        <div className="flex items-center gap-4 min-w-0">
          {conversation ? (
            <ConversationAvatar conversation={conversation} currentUserId={session.user?.id} />
          ) : (
            <UserAvatar
              src={conversationInfo?.photoUrl}
              name={conversationInfo?.conversationName}
              isOnline={Boolean(conversationInfo?.isOnline)}
            />
          )}
          <div className="min-w-0">
            <p className="font-medium truncate max-w-96">{conversationInfo?.conversationName}</p>
            {Boolean(conversationInfo?.lastOnline) && (
              <p className="text-xs font-medium text-muted-foreground">{conversationInfo?.lastOnline}</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        {conversation?.status !== ConversationStatus.BLOCKED && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="aspect-square h-fit w-auto rounded-full p-1 text-primary hover:text-accent-none hover:scale-105"
                  aria-label="Start video call"
                  onClick={outgoingCall.start}
                >
                  <Video className="fill-primary" />
                </Button>
              </TooltipTrigger>
            </Tooltip>
          </TooltipProvider>
        )}
        <Button
          variant="ghost"
          className="aspect-square h-fit w-auto rounded-full p-1 text-primary"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <Ellipsis />
        </Button>
      </div>
      <OutgoingCallDialog
        status={outgoingCall.status}
        name={conversationInfo?.conversationName ?? ''}
        avatar={callAvatar}
        onCancel={outgoingCall.cancel}
        onClose={outgoingCall.close}
        onCallAgain={outgoingCall.start}
      />
    </section>
  );
}
