import useConversation from '@/components/hooks/queries/useConversation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PATCHRequest } from '@/lib/server/requests';
import { cn } from '@/lib/utils';
import { Conversation } from '@repo/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserRound, UserRoundPlus, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { toast } from 'sonner';

export default function ManageAdmin() {
  const { session } = useAuth();

  const params = useParams<{ id: string }>();
  const { data: conversation } = useConversation(params.id);

  const queryClient = useQueryClient();

  const isAdmin = useMemo(() => {
    if (!conversation || !session) return false;
    return conversation.admins.some((user) => user.id === session.user?.id);
  }, [session.user, conversation]);

  const manageAdmin = useMutation<void, Error, { admin: string; adminAction: 'ADD' | 'REMOVE' }>({
    mutationFn: async ({ admin, adminAction }) => {
      try {
        const { message, status } = await PATCHRequest('/v1/conversation/' + params.id + '/admins', {
          adminAction,
          admin,
        });
        if (status !== 'OK') throw new Error(message);
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
    onSuccess: (_, { admin, adminAction }) => {
      queryClient.setQueryData<Conversation>(['conversation', params.id], (prev) => {
        if (!prev) return;

        switch (adminAction) {
          case 'ADD': {
            return {
              ...prev,
              admins: [...prev.admins, prev.members.find((user) => user.id === admin)!],
            };
          }
          case 'REMOVE':
            return { ...prev, admins: prev.admins.filter((user) => user.id !== admin) };
        }
      });
    },
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          className={cn(isAdmin ? 'w-full p-2  font-medium text-primary' : 'hidden')}
          disabled={!isAdmin}
        >
          <span className="aspect-square h-fit w-auto rounded-full p-2 ">
            <UserRoundPlus className="h-4 w-auto" />
          </span>
          <span>Manage admin</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-8 w-[40dvw]">
        <DialogHeader>
          <DialogTitle>Manage admin</DialogTitle>
        </DialogHeader>
        <DialogClose asChild className="absolute top-2 right-2">
          <Button variant="ghost" className="aspect-square h-fit w-auto p-2 rounded-full">
            <X className="h-4 w-auto" />
          </Button>
        </DialogClose>
        <ScrollArea className="h-[40dvh]">
          <div className="grid gap-2">
            {conversation?.members.map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage src={user.photo?.url} />
                    <AvatarFallback>
                      <UserRound className="h-1/2 w-auto" />
                    </AvatarFallback>
                  </Avatar>
                  <p className="truncate max-w-80">{user.displayName}</p>
                </div>
                {user.id === session.user?.id ? (
                  <p className="text-xs font-semibold text-muted-foreground mr-4">You</p>
                ) : conversation.admins.some((admin) => admin.id === user.id) ? (
                  <Button
                    disabled={manageAdmin.isPending}
                    size="sm"
                    variant="destructive"
                    onClick={() => manageAdmin.mutate({ admin: user.id, adminAction: 'REMOVE' })}
                  >
                    Remove
                  </Button>
                ) : (
                  <Button
                    disabled={manageAdmin.isPending}
                    size="sm"
                    onClick={() => manageAdmin.mutate({ admin: user.id, adminAction: 'ADD' })}
                  >
                    Add
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
