"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, Settings, SquarePen, UserRound } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

export default function HomeSideBarMobileHeader() {
  const router = useRouter();
  const { session, logout } = useAuth();

  return (
    <>
      <div className="flex items-center justify-between md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="secondary"
              className="aspect-square h-fit w-auto p-2 rounded-full"
            >
              <Menu className="h-6 w-auto" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col gap-10 p-0 py-4">
            <SheetTitle></SheetTitle>
            <div className="flex flex-col items-center gap-4">
              <Avatar className="border aspect-square w-[40dvw] h-auto">
                <AvatarImage src={session.user?.photo?.url} />
                <AvatarFallback>
                  <UserRound className="h-1/2 w-auto" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-center">
                <span className="text-lg font-medium truncate max-w-64">
                  {session.user?.display_name}
                </span>
                <span className="text-xs text-muted-foreground truncate max-w-60">
                  {session.user?.username}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => router.push("/settings")}
            >
              <Settings className="h-4 w-auto" />
              <span>Settings</span>
            </Button>
            <Button
              variant="outline"
              className="mt-auto mx-5"
              onClick={async () => await logout()}
            >
              <LogOut className="h-4 w-auto" />
              <span>Logout</span>
            </Button>
          </SheetContent>
        </Sheet>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="aspect-square h-fit w-auto rounded-full p-2 md:hidden"
                onClick={() => router.push("/compose")}
              >
                <SquarePen className="h-4 w-auto" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>Compose</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <p className="font-bold  md:hidden">Conversations</p>
    </>
  );
}
