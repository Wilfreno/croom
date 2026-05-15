"use client";

import { MessageCircleOff } from "lucide-react";

export default function Error({ error }: { error: Error; reset: () => void }) {
  return (
    <section className="grow grid place-items-center">
      <div className="flex flex-col items-center justify-center gap-8 text-muted-foreground">
        <MessageCircleOff className="h-28 w-auto stroke-1" />
        <span className="font-medium ">{error.message}</span>
      </div>
    </section>
  );
}
