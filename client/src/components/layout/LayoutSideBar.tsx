"use client";
import Link from "next/link";
import {
  BellIcon,
  ChatBubbleOvalLeftIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArchiveBoxIcon,
  ChatBubbleOvalLeftEllipsisIcon,
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

export default function LayoutSideBar() {
  const path_name = usePathname();

  const nav_list = [
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
    <section className="h-full w-fit px-2 py-5 flex flex-col items-center">
      <nav className="h-fit w-fit flex flex-col space-y-3">
        {nav_list.map((item) => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={item.link} as={item.link} prefetch>
                  <Button
                    disabled={path_name.startsWith(item.link)}
                    size="lg"
                    variant={
                      path_name.startsWith(item.link) ? "outline" : "ghost"
                    }
                    className="flex aspect-square p-3 w-12 h-auto hover:bg-muted group"
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
              <DropdownMenuItem>a</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <ThemeToggler />
      </div>
    </section>
  );
}
