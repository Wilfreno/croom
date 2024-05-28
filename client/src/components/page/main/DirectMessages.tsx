"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PencilSquareIcon } from "@heroicons/react/24/solid";
import { useSession } from "next-auth/react";

export default function DirectMessages() {
  const { data } = useSession();
  return (
    <div className="flex flex-col space-y-5 mx-2">
      <div className="flex items-center justify-between ">
        <p className="font-bold text-sm">Direct messages</p>
        <Button variant="ghost" className="p-1 h-fit" type="button">
          <PencilSquareIcon className="h-4" />
        </Button>
      </div>
      <ScrollArea className="h-[35dvh] my-2">
        <div className="mx-3 space-y-1"></div>
      </ScrollArea>
    </div>
  );
}
