import React from "react";
import ConversationMessages from "./ConversationMessages";
import MessageInput from "./MessageInput";

export default function ConversationContent() {
  return (
    <section className="w-full h-full grid grid-rows-[1fr_auto]">
      <ConversationMessages />
      <MessageInput />
    </section>
  );
}
