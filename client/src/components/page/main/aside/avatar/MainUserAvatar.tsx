"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DELETERequest } from "@/lib/server/requests";
import { UserRound } from "lucide-react";
import { toast } from "sonner";

export default function MainUserAvatar() {
  const { session, logout } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full">
        <Avatar>
          <AvatarImage src={session.user?.photo?.url} />
          <AvatarFallback className="bg-background">
            <UserRound className="h-1/2 w-auto" />
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" sideOffset={14}>
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={async () => {
              try {
                const { status, message } = await DELETERequest("/v1/user/session");

                if (status !== "OK") throw new Error(message);
                await logout();
              } catch (error) {
                toast.error((error as Error).message);
              }
            }}
          >
            logout
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
