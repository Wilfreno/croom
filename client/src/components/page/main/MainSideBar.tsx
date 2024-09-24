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
import {
  Bell,
  Globe,
  Home,
  LogOut,
  MessageCircleMore,
  Settings,
  User,
  UserRound,
  UsersRound,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

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

  return (
    <aside className="sticky inset-y-0 shadow-md py-3 w-64 h-dvh">
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
          {items.map((item) => (
            <Link key={item.name} href={item.link}>
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
                <span>{item.name}</span>
              </Button>
            </Link>
          ))}
        </nav>
      </span>
    </aside>
  );
}
