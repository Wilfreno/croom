"use client";
import Link from "next/link";
import {
  BellIcon,
  ChatBubbleOvalLeftIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArchiveBoxIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  HomeIcon,
} from "@heroicons/react/24/solid";
import { Button } from "../ui/button";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { ThemeToggler } from "../dark-mode/ThemeToggler";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { signOut } from "next-auth/react";

export default function LayoutSideBar() {
  const path_name = usePathname();

  const nav_list = [
    {
      name: "home",
      link: "/",
      icon: <HomeIcon className={cn("h-full fill-secondary-foreground")} />,
    },
    {
      name: "chat",
      link: "/chat",
      icon: (
        <ChatBubbleOvalLeftIcon
          className={cn(
            "h-full fill-muted-foreground  group-hover:fill-primary",
            path_name.startsWith("/chat") && "fill-primary"
          )}
        />
      ),
    },
    {
      name: "discover rooms",
      link: "/discover",
      icon: (
        <MagnifyingGlassIcon
          className={cn(
            "h-full fill-muted-foreground  group-hover:fill-primary",
            path_name.startsWith("/discover") && "fill-primary"
          )}
        />
      ),
    },
    {
      name: "archived chat",
      link: "/archive",
      icon: (
        <ArchiveBoxIcon
          className={cn(
            "h-full fill-muted-foreground  group-hover:fill-primary",
            path_name.startsWith("/archive") && "fill-primary"
          )}
        />
      ),
    },
    {
      name: "chat requests",
      link: "/request",
      icon: (
        <ChatBubbleOvalLeftEllipsisIcon
          className={cn(
            "h-full fill-muted-foreground  group-hover:fill-primary",
            path_name.startsWith("/request") && "fill-primary"
          )}
        />
      ),
    },
    {
      name: "create room",
      link: "/create",
      icon: (
        <PlusIcon
          className={cn(
            "h-full fill-muted-foreground  group-hover:fill-primary",
            path_name.startsWith("/create") && "fill-primary"
          )}
        />
      ),
    },
  ];
  return (
    <section className="h-full w-fit px-2 py-5 flex flex-col items-center bg-primary-foreground">
      <nav className="h-fit w-fit flex flex-col space-y-3">
        {nav_list.map((item, index) => (
          <TooltipProvider key={item.name}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={item.link} as={item.link} prefetch>
                  <Button
                    disabled={path_name.startsWith(item.link)}
                    size="lg"
                    variant={
                      index === 0
                        ? "ghost"
                        : path_name.startsWith(item.link)
                        ? "outline"
                        : "ghost"
                    }
                    className={cn(
                      "flex aspect-square p-3 w-12 h-auto hover:bg-muted group",
                      index === 0 && "bg-secondary"
                    )}
                  >
                    {item.icon}
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent
                className="bg-secondary"
                side="right"
                align="start"
                alignOffset={-5}
              >
                <p className="text-primary">{item.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </nav>
      <Separator className="h-1 my-5 bg-primary rounded-full" />
      <div className="mt-auto h-fit w-fit flex flex-col space-y-3 items-center">
        <Button
          size="lg"
          variant="ghost"
          className="flex aspect-square p-3 w-12 h-auto hover:bg-muted group"
        >
          <BellIcon className="h-full fill-muted-foreground  group-hover:fill-primary" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="aspect-square w-10 h-fit p-0 focus-visible:ring-0 rounded-full"
            >
              <Avatar className="h-full w-full">
                <AvatarImage src="" alt="user" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right">
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => {
                  signOut();
                }}
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <ThemeToggler />
      </div>
    </section>
  );
}
