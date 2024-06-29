"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

export default function UserMenu() {
  const { data } = useSession();

  return (
    <div className="border-t flex items-center p-1">
      <Button
        variant="ghost"
        className="flex items-center space-x-3 grow h-full justify-start rounded"
      >
        <Avatar>
          <AvatarImage
            src={data?.user.profile_photo?.url!}
            alt={data?.user.user_name?.slice(0, 1).toUpperCase()}
          />
          <AvatarFallback>
            {data?.user.user_name?.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <p className="font-bold">{data?.user.display_name}</p>
      </Button>
    </div>
  );
}
