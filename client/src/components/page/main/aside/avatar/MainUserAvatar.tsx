"use client";

<<<<<<< HEAD
import { useAuth } from "@/components/providers/SessionProvider";
=======
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
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
<<<<<<< HEAD
import { toast } from "sonner";

export default function MainUserAvatar() {
  const { session, logout } = useAuth();
=======
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";

export default function MainUserAvatar() {
  const { data } = useSession();
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full">
        <Avatar>
<<<<<<< HEAD
          <AvatarImage src={session.user?.photo?.url} />
=======
          <AvatarImage src={data?.user.photo?.url} />
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
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
<<<<<<< HEAD
                await logout();
=======
                await signOut();
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
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
