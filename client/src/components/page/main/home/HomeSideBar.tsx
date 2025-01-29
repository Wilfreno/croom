"use client";
import React from "react";
import SidebarContent from "../SidebarContent";
import HomeActiveFriends from "./HomeActiveConversation";
import HomeConversations from "./HomeConversations";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Menu, SquarePen } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import useUserAgent from "@/components/hooks/useUserAgent";

export default function HomeSideBar() {
  const { data: open } = useQuery({ queryKey: ["home", "sidebar"], queryFn: () => true });
  const { on_mobile: is_mobile } = useUserAgent();
  const router = useRouter();
  const pathname = usePathname();

  if (is_mobile && pathname !== "/") return null;
  return (
    <SidebarContent
      className={cn(
        open
          ? "grid grid-rows-[auto_auto_1fr] gap-2 pt-5 md:grid-rows-[auto_1fr] md:gap-4 md:py-5"
          : "hidden"
      )}
    >
      <div className="flex items-center justify-between md:hidden">
        <Button
          variant="secondary"
          className="aspect-square h-fit w-auto p-2 rounded-full"
        >
          <Menu className="h-6 w-auto" />
        </Button>

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

      <HomeActiveFriends />
      <HomeConversations />
    </SidebarContent>
  );
}
