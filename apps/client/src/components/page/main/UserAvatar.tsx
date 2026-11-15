'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { UserRound } from 'lucide-react';

export default function UserAvatar({
  src,
  isOnline,
  className,
  onlineClassName,
}: {
  src?: string;
  isOnline: boolean;
  className?: string;
  onlineClassName?: string;
}) {
  return (
    <div className="relative h-fit w-fit">
      <Avatar className={cn('aspect-square', className)}>
        <AvatarImage src={src} />
        <AvatarFallback className="bg-background">
          <UserRound className="h-1/2 w-auto" />
        </AvatarFallback>
      </Avatar>
      {isOnline && (
        <div
          className={cn(
            'bg-green-500 aspect-square h-4 border-2 border-background w-auto rounded-full absolute bottom-0 right-0',
            onlineClassName,
          )}
        ></div>
      )}
    </div>
  );
}
