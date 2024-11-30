import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Plus, UserRound } from "lucide-react";

export default function HomeActiveFriends() {
  return (
    <section className="w-full">
      <p className="text-xs font-medium text-muted-foreground">Active friends</p>
      <div className="flex items-center gap-2">
        <Button variant="outline" className="aspect-square h-fit w-auto p-2 rounded-full">
          <Plus className="h-5 w-auto" />
        </Button>
        <ScrollArea className="w-64 py-4">
          <div className="flex items-center gap-2">
            {Array.from({ length: 10 }).map((_, index) => (
              <span key={index} className="relative">
                <Avatar>
                  <AvatarImage />
                  <AvatarFallback>
                    <UserRound className="h-1/2 w-auto" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-green-500 aspect-square h-2 w-auto rounded-full absolute bottom-1 right-1"></div>
              </span>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </section>
  );
}
