"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenuItem,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DELETERequest } from "@/lib/server/requests";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Globe,
  Home,
  LogOut,
  MessageCircleMore,
  Settings,
  SquareChevronLeft,
  SquareChevronRight,
  UserRound,
  UsersRound,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
export default function MainSideBar() {
  const { data } = useSession();
  const pathname = usePathname();
  const items = [
    {
      name: "Home",
      link: "/",
      icon: <Home className="h-5 w-auto" />,
    },

    {
      name: "Friends",
      link: "/friend",
      icon: <UsersRound className="h-5 w-auto" />,
    },
    {
      name: "Lobby",
      link: "/lobby",
      icon: <MessageCircleMore className="h-5 w-auto" />,
    },
    {
      name: "Notification",
      link: "/notification",
      icon: <Bell className="h-5 w-auto" />,
    },
    {
      name: "Settings",
      link: "/settings",
      icon: <Settings className="h-5 w-auto" />,
    },
  ];

  const { data: open_sidebar } = useQuery({
    queryKey: ["open_sidebar"],
    initialData: true,
  });
  const query_client = useQueryClient();
  return (
    <motion.aside
      initial={{ width: !open_sidebar ? "3.5rem" : "16rem" }}
      animate={{ width: open_sidebar ? "16rem" : "3.5rem" }}
      className="sticky grid grid-rows-[auto_1fr] inset-y-0 shadow-md py-3 h-dvh"
    >
      <Button
        size="sm"
        variant="ghost"
        className={cn(
          "w-fit",
          open_sidebar ? "justify-self-end" : "justify-self-center"
        )}
        onClick={() => {    
          query_client.setQueryData(["open_sidebar"], !open_sidebar);
        }}
      >
        {!open_sidebar ? (
          <SquareChevronRight className="h-6 w-auto  stroke-primary" />
        ) : (
          <SquareChevronLeft className="h-6 w-auto  stroke-primary" />
        )}
      </Button>
      <span className="space-y-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="gap-4 p-2 h-fit w-full justify-start rounded-none"
            >
              <Avatar>
                <AvatarImage src={data?.user?.photo.url} />
                <AvatarFallback className="p-2">
                  <UserRound className="h-full w-auto" />
                </AvatarFallback>
              </Avatar>
              {open_sidebar && (
                <div className={cn("text-start w-full", !data && "space-y-2")}>
                  <p
                    className={cn(
                      "truncate font-bold",
                      !data &&
                        "bg-muted-foreground h-4 w-2/3 animate-pulse rounded-full"
                    )}
                  >
                    {data?.user.display_name}
                  </p>

                  <p
                    className={cn(
                      "truncate text-xs text-muted-foreground",
                      !data &&
                        "bg-muted-foreground h-2 w-1/4  animate-pulse rounded-full"
                    )}
                  >
                    {data?.user.username}
                  </p>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="start"
            className="w-[clamp(18rem,_18rem,_95vw)]"
          >
            <DropdownMenuGroup className="space-y-2">
              <DropdownMenuItem className="cursor-pointer bg-muted hover:shadow-md transition ease-out duration-300">
                <Link
                  href={"/user/@me"}
                  className="flex items-center gap-4 w-full"
                >
                  <Avatar>
                    <AvatarImage src={data?.user?.photo.url} />
                    <AvatarFallback>
                      <UserRound className="h-full w-auto" />
                    </AvatarFallback>
                  </Avatar>
                  <p className="truncate text-center font-medium">
                    {data?.user.username}
                  </p>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  await DELETERequest("/v1/user/session");
                  await signOut();
                }}
                className="cursor-pointer py-2 flex items-center gap-4 font-medium"
              >
                <LogOut className="h-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <nav className="grid w-full gap-2">
          <TooltipProvider>
            {items.map((item) => (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <Link href={item.link}>
                    <Button
                      variant={
                        item.link === "/"
                          ? pathname === "/"
                            ? "secondary"
                            : "ghost"
                          : pathname.startsWith(item.link)
                          ? "secondary"
                          : "ghost"
                      }
                      className={cn(
                        "gap-3 justify-start h-12 w-full font-medium text-muted-foreground",
                        item.link === "/"
                          ? pathname === "/"
                            ? "text-primary stroke-primary"
                            : ""
                          : pathname.startsWith(item.link)
                          ? "text-primary stroke-primary"
                          : ""
                      )}
                    >
                      {item.icon}
                      {open_sidebar && <span>{item.name}</span>}
                    </Button>
                  </Link>
                </TooltipTrigger>
                {!open_sidebar && (
                  <TooltipContent side="right">{item.name}</TooltipContent>
                )}
              </Tooltip>
            ))}
          </TooltipProvider>
        </nav>
      </span>
    </motion.aside>
  );
}
