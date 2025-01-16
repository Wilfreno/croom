"use client";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { House } from "lucide-react";
import MainUserAvatar from "./avatar/MainUserAvatar";
import { useRouter } from "next/navigation";

export default function Aside() {
  const icon_styles = cn("h-6 w-auto");

  const items = [{ name: "Home", icon: <House className={icon_styles} />, link: "/" }];

  const router = useRouter();
  return (
<<<<<<< HEAD
    <aside className="inset-y-0 flex flex-col items-center px-2 py-4">
=======
    <aside className="inset-y-0 flex flex-col items-center py-5 px-4">
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
      <div className="flex flex-col items-center">
        {items.map((item) => (
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
        ))}
      </div>
      <div className="mt-auto flex flex-col items-center gap-4 mb-6">
        <MainUserAvatar />
      </div>
    </aside>
  );
}
