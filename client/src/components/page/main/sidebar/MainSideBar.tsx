import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { House } from "lucide-react";
import MainUserAvatar from "./avatar/MainUserAvatar";
import Notification from "./notification/Notification";

export default function MainSideBar() {
  const icon_styles = cn("h-6 w-auto");

  const items = [{ name: "Home", icon: <House className={icon_styles} /> }];

  return (
    <aside className="inset-y-0 flex flex-col items-center py-5 px-4">
      <div className="flex flex-col items-center">
        {items.map((item) => (
          <TooltipProvider key={item.name}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={item.name === "Home" ? "default" : "outline"}
                  className="aspect-square h-fit w-auto p-2 rounded-lg"
                >
                  {item.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{item.name}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
      <div className="mt-auto flex flex-col items-center gap-4 mb-6">
        <Notification />
        <MainUserAvatar />
      </div>
    </aside>
  );
}
