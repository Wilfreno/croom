'use client';
import { useAuth } from '@/components/providers/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GETRequest } from '@/lib/server/requests';
import { Conversation, User } from '@repo/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AtSign, Mail, Send, UserRound, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useMemo } from 'react';
import { toast } from 'sonner';

export default function UserInfoDialog({ children, user }: { children: React.ReactNode; user: User }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { session } = useAuth();

  async function startConversation() {
    try {
      const { data } = await GETRequest<Conversation[]>('/v1/conversation?members=' + session.user?.id + ',' + user.id);

      if (!!data.length) {
        router.push('/conversation/' + data[0].id);
      } else {
        queryClient.setQueryData<string[][]>(
          ['compose', 'selected_users'],
          [[userInfo!.id, userInfo!.displayName]],
        );
        router.push('/compose');
      }
    } catch {
      toast.error('Oops! something went wrong');
    }
  }

  const { data: userInfo } = useQuery<User>({
    queryKey: ['user', user.id],
    queryFn: () => user,
  });

  const lastOnline = useMemo(() => {
    if (!userInfo || userInfo.status === 'ONLINE') return '';
    const lastOnline = new Date(userInfo.lastOnline);
    const now = new Date();
    const relativeDateInSeconds = Math.floor((now.getTime() - lastOnline.getTime()) / 1000);

    const day = 60 * 60 * 24;
    const hour = 60 * 60;
    const minute = 60;

    if (relativeDateInSeconds > day) return Math.floor(relativeDateInSeconds / day) + ' day(s)';
    if (relativeDateInSeconds > hour) return Math.floor(relativeDateInSeconds / hour) + ' hour(s)';
    if (relativeDateInSeconds > minute) return Math.floor(relativeDateInSeconds / minute) + ' minute(s)';
    return relativeDateInSeconds + ' seconds(s)';
  }, [userInfo]);

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[30rem]">
        <DialogHeader>
          <DialogTitle></DialogTitle>
        </DialogHeader>
        <DialogClose className="absolute top-4 right-4">
          <X className="h-4 w-auto" />
        </DialogClose>
        <div className="flex items-start gap-8">
          <Avatar className="aspect-square h-28 w-auto">
            <AvatarImage src={userInfo?.photo?.url} />
            <AvatarFallback>
              <UserRound className="h-1/2 w-auto" />
            </AvatarFallback>
          </Avatar>
          <div className="grid gap-5">
            <div className="grid">
              <span className="text-xl font-semibold ">{userInfo?.displayName}</span>
              {userInfo?.status === 'ONLINE' ? (
                <div className="relative font-semibold w-fit flex items-center gap-2 text-xs">
                  <span>Online</span>
                  <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                </div>
              ) : (
                <p className="text-xs font-medium">online {lastOnline} ago</p>
              )}
            </div>
            <div className="grid gap-1">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-auto" />
                <span>{userInfo?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <AtSign className="h-4 w-auto" />
                <span>{userInfo?.username.slice(1)}</span>
              </div>
            </div>

            <Button variant="outline" className="justify-start w-fit" onClick={startConversation}>
              <Send className="h-4 w-auto" />
              <span>Message</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
