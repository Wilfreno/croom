import { ScrollArea } from "@/components/ui/scroll-area";

export default function HomeConversations() {
  return (
    <section className="h-full grid gap-4">
      <p className="text-xs font-medium text-muted-foreground">Conversations</p>
      <ScrollArea className="h-[70dvh]">
        <div></div>
      </ScrollArea>
    </section>
  );
}
