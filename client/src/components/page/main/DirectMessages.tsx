import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PencilSquareIcon } from "@heroicons/react/24/solid";

export default function DirectMessages() {
  return (
    <div className="flex flex-col space-y-5 mx-2">
      <div className="flex items-center justify-between ">
        <p className="font-bold text-sm">Direct messages</p>
        <Button variant="ghost" className="p-1 h-fit" type="button">
          <PencilSquareIcon className="h-4" />
        </Button>
      </div>
      <ScrollArea className="h-[35dvh] my-2">
        <div>
          {Array.from({ length: 30 }).map((_, index) => (
            <p>{index}</p>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
