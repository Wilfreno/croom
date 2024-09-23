import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell } from "lucide-react";

export default function Notification() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="rounded-full">
          <Bell className="h-5 w-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>yeahhh</DropdownMenuContent>
    </DropdownMenu>
  );
}
