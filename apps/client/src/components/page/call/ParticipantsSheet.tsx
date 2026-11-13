'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ParticipantListItem } from '@/types/call.types';
import { MicOff, UserRound, VideoOff } from 'lucide-react';
import type { ReactNode } from 'react';

/** Side panel listing call participants, opened by whatever element is passed as `trigger`. */
export default function ParticipantsSheet({
  trigger,
  title,
  description,
  items,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  items: ParticipantListItem[];
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <ScrollArea className="min-h-0 grow">
          <ul className="grid gap-1">
            {items.map((item) => (
              <li key={item.key} className="flex items-center gap-3 rounded-md p-2 hover:bg-muted">
                <MemberAvatar photoUrl={item.photoUrl} />
                <span className="grow truncate text-sm font-medium">
                  {item.displayName}
                  {item.isYou && <span className="text-muted-foreground"> (You)</span>}
                </span>
                {item.isCameraOff && <VideoOff className="h-4 w-4 text-muted-foreground" aria-label="Camera off" />}
                {item.isMuted && <MicOff className="h-4 w-4 text-muted-foreground" aria-label="Muted" />}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export function MemberAvatar({ photoUrl, className }: { photoUrl?: string | null; className?: string }) {
  return (
    <Avatar className={cn(className)}>
      <AvatarImage src={photoUrl ?? undefined} />
      <AvatarFallback>
        <UserRound className="h-1/2 w-auto" />
      </AvatarFallback>
    </Avatar>
  );
}
