import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { UserRound } from "lucide-react";

export default function HomeActiveFriends() {
  return (
    <section className="w-full grid">
      <p className="font-bold">Active friends</p>
      <div className="flex items-center gap-2">
        <ScrollArea className="w-72 py-2 pb-3  h-16">
          <div className="flex items-center gap-2">
            {Array.from({ length: 10 }).map((_, index) => (
              <span key={index} className="relative">
                <Avatar>
                  <AvatarImage />
                  <AvatarFallback className="bg-background">
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
