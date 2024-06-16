import { ScrollArea } from "@/components/ui/scroll-area";
import Notification from "./notification/Notification";

export default function MainRightSideBar() {
  return (
    <div className="hidden xl:grid grid-rows-2 w-1/5 h-full py-10 px-5  space-y-10  border-l  border-primary-foreground bg-secondary">
      <Notification />
      <div className="grid grid-rows-[auto_1fr] space-y-5">
        <p className="font-bold text-sm">Active friends</p>
        <ScrollArea className="h-full">
          <div></div>
        </ScrollArea>
      </div>
    </div>
  );
}
