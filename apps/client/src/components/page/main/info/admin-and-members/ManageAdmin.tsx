import useManageAdmin from '@/components/hooks/mutation/useManageAdmin.mutation';
import useConversation from '@/components/hooks/queries/useConversation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import InitialsFallback from '@/components/page/main/InitialsFallback';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { UserRoundPlus, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';

export default function ManageAdmin() {
  const { session } = useAuth();

  const params = useParams<{ id: string }>();
  const { data: conversation } = useConversation(params.id);

  const { addAdmin, removeAdmin } = useManageAdmin(params.id);
  const isPending = addAdmin.isPending || removeAdmin.isPending;

  const isAdmin = useMemo(() => {
    if (!conversation || !session) return false;
    return conversation.admins.some((user) => user.id === session.user?.id);
  }, [session.user, conversation]);

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
      <DialogContent className="gap-8 md:w-[40dvw]">
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
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar>
                    <AvatarImage src={user.photo?.url} />
                    <InitialsFallback name={user.displayName} colorKey={user.id} />
                  </Avatar>
                  <p className="truncate">{user.displayName}</p>
                </div>
                {user.id === session.user?.id ? (
                  <p className="text-xs font-semibold text-muted-foreground mr-4">You</p>
                ) : conversation.admins.some((admin) => admin.id === user.id) ? (
                  <Button
                    disabled={isPending}
                    size="sm"
                    variant="destructive"
                    onClick={() => removeAdmin.mutate(user.id)}
                  >
                    Remove
                  </Button>
                ) : (
                  <Button
                    disabled={isPending}
                    size="sm"
                    onClick={() => addAdmin.mutate(user.id)}
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
