'use client';
import { UserStatus } from '@repo/enums';

import useInfoSidebarOpen from '@/components/hooks/queries/useInfoSidebarOpen';
import { useSocketIO } from '@/components/providers/SocketIOProvider';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ConversationInfo } from '@/types/common.types';
import { ArrowLeft, Ellipsis, Video } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import UserAvatar from '../UserAvatar';

export default function ConversationHeader({ conversationInfo }: { conversationInfo: ConversationInfo }) {
  const { onMobile, setIsOpen } = useInfoSidebarOpen();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const socket = useSocketIO();

  function startCall() {
    socket?.emit('CALL', { conversationId: params.id });
    router.push(`/call/${params.id}`);
  }
  return (
    <section
      className={cn(
        'w-full border-b flex items-center justify-between  relative gap-4  shadow-lg h-full',
        onMobile ? 'p-2' : 'p-3',
      )}
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" className="aspect-square h-fit w-auto p-1 md:hidden" onClick={() => router.push('/')}>
          <ArrowLeft className="h-4 w-auto" />
        </Button>
        <div className="flex items-center gap-4">
          <UserAvatar src={conversationInfo?.photoUrl} isOnline={conversationInfo?.status === UserStatus.ONLINE} />
          <div>
            <p className="font-medium truncate max-w-96">{conversationInfo?.conversationName}</p>
            {!!conversationInfo?.lastOnline && (
              <p className="text-xs font-medium text-muted-foreground">{conversationInfo?.lastOnline}</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="aspect-square h-fit w-auto rounded-full p-1 text-primary hover:text-accent-none hover:scale-105"
                aria-label="Start video call"
                onClick={startCall}
              >
                <Video className="fill-primary" />
              </Button>
            </TooltipTrigger>
          </Tooltip>
        </TooltipProvider>
        <Button
          variant="ghost"
          className="aspect-square h-fit w-auto rounded-full p-1 text-primary"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <Ellipsis />
        </Button>
      </div>
    </section>
  );
}
