import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import UserAvatar from "../UserAvatar";

export default function HomeActiveFriends() {
  return (
    <section className="w-full grid">
      <p className="font-bold">Active friends</p>
      <div className="flex items-center gap-2">
        <ScrollArea className="w-72 py-2 pb-3  h-16">
          <div className="flex items-center gap-2">
            {Array.from({ length: 10 }).map((_, index) => (
              <UserAvatar key={index} />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </section>
  );
}
