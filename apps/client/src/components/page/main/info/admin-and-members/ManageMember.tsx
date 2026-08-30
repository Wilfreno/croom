'use client';
import useDebounce from '@/components/hooks/useDebounce';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getConvoOptions } from '@/lib/react-query/prefetch-query-options';
import { GETRequest, PATCHRequest } from '@/lib/server/requests';
import { cn } from '@/lib/utils';
import { Conversation, User } from '@repo/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, UserRoundPlus, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import UserAvatar from '../../UserAvatar';

export default function ManageMember() {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);

  const { session } = useAuth();
  const debouncedValue = useDebounce(value);
  const params = useParams<{ id: string }>();
  const divRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();
  const { data: queryResponse } = useQuery(getConvoOptions(params.id));

  const { data: result } = useQuery({
    queryKey: ['search', 'user', debouncedValue],
    queryFn: async () => {
      try {
        if (!debouncedValue) return [];
        const { data, status, message } = await GETRequest<User[]>('/v1/user/search?value=' + debouncedValue);

        if (status !== 'OK') {
          toast.error(message);
          throw new Error(message);
        }

        return data;
      } catch (error) {
        throw error;
      }
    },
    placeholderData: [],
  });

  const members = useMutation<User, Error, { id: string; action: 'ADD' | 'REMOVE'; index: number; username: string }>({
    mutationFn: async ({ id, action, username }) => {
      try {
        let user: User;
        if (action === 'ADD') {
          const { data, status: getStatus, message: getMessage } = await GETRequest<User>('/v1/user/' + username);
          if (getStatus !== 'OK') throw new Error(getMessage);
          user = data;
        }

        const { status: patchStatus, message: patchMessage } = await PATCHRequest(
          '/v1/conversation/' + params.id + '/members',
          {
            member: id,
            action,
          },
        );

        if (patchStatus !== 'OK') throw new Error(patchMessage);

        return user!;
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
    onSuccess: (user, { action, index }) => {
      queryClient.setQueryData<Conversation>(['conversation', params.id], (prev) => {
        if (!prev) return;
        switch (action) {
          case 'ADD': {
            return { ...prev, members: [...prev.members, user] };
          }
          case 'REMOVE': {
            return { ...prev, members: prev.members.toSpliced(index, 1) };
          }
        }
      });
    },
  });

  const isAdmin = useMemo(() => {
    if (!session || !queryResponse?.data) return false;

    return (queryResponse?.data as Conversation).admins.some((user) => user.id === session.user?.id);
  }, [session, queryResponse]);

  useEffect(() => {
    function handleCLick(event: MouseEvent) {
      if (divRef.current && !divRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleCLick);
    return () => {
      document.removeEventListener('mousedown', handleCLick);
    };
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" disabled={!isAdmin}>
          <UserRoundPlus className="h-4 w-auto text-primary" />
          <span>Manage Members</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[40dvw] ">
        <DialogHeader>
          <DialogTitle></DialogTitle>
        </DialogHeader>
        <DialogClose asChild>
          <Button variant="ghost" className="absolute top-2 right-2  aspect-square h-fit w-auto rounded-full p-1">
            <X className="h-4 w-auto" />
          </Button>
        </DialogClose>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <span className="text-lg font-semibold">Search to add or remove user</span>
            <div className="relative">
              <Search className="absolute top-1/2 left-2 h-4 w-auto -translate-y-1/2" />
              <Input
                value={value}
                placeholder="Username"
                className="px-8"
                onFocus={() => setOpen(true)}
                onChange={(e) => setValue(e.target.value)}
              />
              {!!value && (
                <Button
                  variant="ghost"
                  className="absolute top-1/2 right-2 -translate-y-1/2 aspect-square h-fit w-auto rounded-full p-1"
                  onClick={() => setValue('')}
                >
                  <X className="h-4 w-auto" />
                </Button>
              )}
              <div
                ref={divRef}
                className={cn(
                  'absolute top-full left-0 w-full border bg-background z-50 my-1 rounded-sm shadow-md',
                  !open && 'hidden',
                )}
              >
                <ScrollArea className="h-[30dvh]">
                  <div className="p-2 grid gap-2">
                    {result?.map((user, index) => (
                      <div key={user.id} className="flex items-center justify-between">
                        <div className="flex items-start gap-2">
                          <UserAvatar src={user.photo?.url} isOnline={user.status === 'ONLINE'} />
                          <div>
                            <p className="font-semibold">{user.displayName}</p>
                            <p className="text-xs text-muted-foreground">{user.username}</p>
                          </div>
                        </div>
                        {(queryResponse?.data as Conversation).members.some((member) => member.id === user.id) ? (
                          <Button
                            disabled={members.isPending && members.variables.id === user.id}
                            variant="destructive"
                            onClick={() =>
                              members.mutate({
                                action: 'REMOVE',
                                id: user.id,
                                index,
                                username: user.username,
                              })
                            }
                          >
                            Remove
                          </Button>
                        ) : (
                          <Button
                            disabled={members.isPending && members.variables.id === user.id}
                            variant="secondary"
                            onClick={() =>
                              members.mutate({
                                action: 'ADD',
                                id: user.id,
                                index,
                                username: user.username,
                              })
                            }
                          >
                            Add
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <span className="text-lg font-semibold">Members</span>
            <ScrollArea className="h-[30dvh]">
              <div className="grid gap-2 p-2">
                {(queryResponse?.data as Conversation).members.map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserAvatar src={user.photo?.url} isOnline={user.status === 'ONLINE'} />
                      <div>
                        <p className="font-semibold">{user.displayName}</p>
                        <p className="text-xs text-muted-foreground">{user.username}</p>
                      </div>
                    </div>
                    {user.id === session.user?.id ? (
                      <span className="text-muted-foreground font-medium px-8">You</span>
                    ) : (
                      <Button
                        disabled={members.isPending && members.variables.id === user.id}
                        variant="destructive"
                        onClick={() =>
                          members.mutate({
                            action: 'REMOVE',
                            id: user.id,
                            index,
                            username: user.username,
                          })
                        }
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
