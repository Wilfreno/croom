'use client';

import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import InitialsFallback from './InitialsFallback';

export default function UserAvatar({
  src,
  name,
  colorKey,
  isOnline,
  className,
  onlineClassName,
}: {
  src?: string;
  name?: string;
  colorKey?: string;
  isOnline: boolean;
  className?: string;
  onlineClassName?: string;
}) {
  return (
    <div className="relative h-fit w-fit">
      <Avatar className={cn('aspect-square', className)}>
        <AvatarImage src={src} />
        <InitialsFallback name={name} colorKey={colorKey} />
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
