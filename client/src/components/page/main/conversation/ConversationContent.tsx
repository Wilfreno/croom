import React from "react";
import ConversationMessages from "./ConversationMessages";
import ConversationMessageInput from "./ConversationMessageInput";

export default function ConversationContent() {
  return (
    <section className="h-full w-full pb-4 gap-2 grid grid-rows-[1fr_auto] px-1 overflow-hidden">
      <ConversationMessages />
      <ConversationMessageInput />
    </section>
  );
}
