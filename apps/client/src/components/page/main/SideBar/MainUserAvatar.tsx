'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MainUserAvatar() {
  const { session, logout } = useAuth();
  const router = useRouter();

  return (
    <section className="h-fit w-[95%] shadow-sm border rounded-sm absolute bottom-5 right-2 bg-background p-2">
      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-full">
          <Avatar className="border border-muted aspect-square h-full w-12">
            <AvatarImage src={session.user?.photo?.url} />
            <AvatarFallback className="bg-background">
              <UserRound className="h-1/2 w-auto" />
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="end" sideOffset={14}>
          <DropdownMenuGroup>
            <div className="flex items-start gap-2 p-2 py-4 w-72">
              <Avatar>
                <AvatarImage src={session.user?.photo?.url} />
                <AvatarFallback className="bg-background">
                  <UserRound className="h-1/2 w-auto" />
                </AvatarFallback>
              </Avatar>
              <div className="grid text-start">
                <p className="font-medium max-w-64 truncate">{session.user?.displayName}</p>
                <p className="text-xs">{session.user?.username}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Button
                variant="ghost"
                className="w-full justify-start cursor-pointer"
                onClick={() => router.push('/settings')}
              >
                <Settings className="h-4 w-auto" />
                <span>Settings</span>
              </Button>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Button
                variant="ghost"
                className="w-full justify-start cursor-pointer"
                onClick={async () => await logout()}
              >
                <LogOut className="h-4 w-auto" />
                <span>Logout</span>
              </Button>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </section>
  );
}
