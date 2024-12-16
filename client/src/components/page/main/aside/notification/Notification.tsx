import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell } from "lucide-react";

export default function Notification() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="aspect-square h-fit w-auto p-2">
          <Bell className="h-4 w-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" sideOffset={14}>
        <p>notifications</p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
