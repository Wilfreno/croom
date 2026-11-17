'use client';
import useBlockConversation from '@/components/hooks/mutation/useBlockConversation.mutation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { axiosInstance } from '@/lib/axios-instance';
import { cn } from '@/lib/utils';
import { Block } from '@/types/block.types';
import { SOMETHING_WENT_WRONG } from '@repo/constants';
import type { ServerResponse } from '@repo/types';
import { useQuery } from '@tanstack/react-query';
import { UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function SettingsBlockedUsers() {
  const [open, setOpen] = useState(false);
  const { session } = useAuth();
  const divRef = useRef<HTMLDivElement>(null);

  const { unblockConversation } = useBlockConversation();

  const { data: blockedList } = useQuery({
    enabled: open,
    queryKey: [session.user!.id, 'blocked'],
    async queryFn() {
      const { data: response } = await axiosInstance.get<ServerResponse<Block[]>>('/user/blocked');

      return response.data;
    },
  });

  function unblock(conversationId: string) {
    unblockConversation.mutate(conversationId, {
      onSuccess: () => toast('user unblocked'),
      onError: () => toast.error(SOMETHING_WENT_WRONG),
    });
  }

  useEffect(() => {
    if (open) divRef.current?.scrollIntoView();
  }, [open]);

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <span className="font-medium">Blocked Users</span>
        <Button variant="outline" onClick={() => setOpen((prev) => !prev)}>
          {open ? 'Close' : 'See list'}
        </Button>
      </div>
      <ScrollArea ref={divRef} className={cn(open ? 'h-[40dvh] rounded-sm border ' : 'hidden')}>
        <div>
          {blockedList?.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">You haven&apos;t blocked anyone.</p>
          )}
          {blockedList?.map(({ blockedUser, id }, index) => (
            <div
              key={id}
              className={cn('flex items-center gap-4 p-2 pr-4', index % 2 === 0 ? 'bg-muted/40' : 'bg-background')}
            >
              <Avatar>
                <AvatarImage src={blockedUser.photo?.url} />
                <AvatarFallback>
                  <UserRound className="h-1/2 w-auto" />
                </AvatarFallback>
              </Avatar>
              <span>{blockedUser.userName}</span>
              <Button
                variant="outline"
                className="ml-auto text-destructive"
                disabled={unblockConversation.isPending && unblockConversation.variables === id}
                onClick={() => unblock(id)}
              >
                Unblock
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
