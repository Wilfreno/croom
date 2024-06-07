import { ScrollArea } from "@/components/ui/scroll-area";
import Notification from "./notification/Notification";

export default function MainRightSideBar() {
  return (
    <div className="w-[20rem] h-full border-l py-10 px-5 grid grid-rows-2 space-y-10">
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
