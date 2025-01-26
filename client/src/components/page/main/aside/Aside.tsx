"use client";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { House } from "lucide-react";
import MainUserAvatar from "./avatar/MainUserAvatar";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

export default function Aside() {
  const icon_styles = cn("h-6 w-auto");

  //   const items = [{ name: "Home", icon: <House className={icon_styles} />, link: "/" }];

  const router = useRouter();
  const pathname = usePathname();
  const query_client = useQueryClient();

  return (
    <aside className="inset-y-0 flex flex-col items-center px-2 py-4">
      <div className="flex flex-col items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="aspect-square h-fit w-auto p-2 rounded-lg"
                onClick={() => {
                  if (pathname === "/") {
                    query_client.setQueryData<boolean>(
                      ["home", "sidebar"],
                      (prev) => !prev
                    );
                  } else router.push("/");
                }}
              >
                <House className={icon_styles} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Home</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {/* {items.map((item) => (
          <TooltipProvider key={item.name}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={item.name === "Home" ? "default" : "outline"}
                  className="aspect-square h-fit w-auto p-2 rounded-lg"
                  onClick={() => router.push(item.link)}
                >
                  {item.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{item.name}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))} */}
      </div>
      <div className="mt-auto flex flex-col items-center gap-4 mb-6">
        <MainUserAvatar />
      </div>
    </aside>
  );
}
