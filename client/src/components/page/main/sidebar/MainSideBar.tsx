import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { House } from "lucide-react";

export default function MainSideBar() {
  const icon_styles = cn("h-6 w-auto");

  const items = [{ name: "Home", icon: <House className={icon_styles} /> }];

  return (
    <aside className="inset-y-0 shadow-md flex flex-col px-1 py-3 bg-background rounded-r">
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
    </aside>
  );
}
