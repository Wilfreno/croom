"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { UserRound } from "lucide-react";

export default function UserAvatar({
  src,
  is_online,
  className,
}: {
  src?: string;
  is_online: boolean;
  className?: string;
}) {
  return (
    <div className="relative h-fit w-fit">
      <Avatar className={cn("aspect-square", className)}>
        <AvatarImage src={src} />
        <AvatarFallback>
          <UserRound className="h-1/2 w-auto" />
        </AvatarFallback>
      </Avatar>
      {is_online && (
        <div className="bg-green-500 aspect-square h-4 border-2 border-background w-auto rounded-full absolute bottom-0 right-0"></div>
      )}
    </div>
  );
}
