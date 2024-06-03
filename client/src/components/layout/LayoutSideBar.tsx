"use client";



import Link from "next/link";
import { PlusIcon, HomeIcon } from "@heroicons/react/24/solid";
import { Button } from "../ui/button";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";
import { ThemeToggler } from "../dark-mode/ThemeToggler";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import CompassSvg from "../svg/CompassSvg";

export default function LayoutSideBar() {
  const path_name = usePathname();

  const nav_list = [
    {
      name: "home",
      link: "/",
      icon: <HomeIcon className={cn("h-full fill-secondary-foreground")} />,
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
    {
      name: "Discover",
      link: "/discover",
      icon: (
        <CompassSvg
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
      <Separator className="h-px my-5 bg-primary rounded-full" />
      <ThemeToggler className="mt-auto" />
    </section>
  );
}
