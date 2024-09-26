import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal } from "lucide-react";
import React, { useRef, useState } from "react";

export default function LobbyChatInput() {
  const [text, setText] = useState("");

  const textarea_ref = useRef<HTMLTextAreaElement>(null);
  return (
    <form
      // onSubmit={sendTextMessage}
      autoComplete="off"
      className="flex items-end gap-2"
    >
      <Textarea
        className="resize-none h-auto max-h-[30dvh] overflow-y-auto bg-accent min-h-10"
        ref={textarea_ref}
        placeholder="Message"
        rows={1}
        value={text}
        onChange={(e) => {
          setText(e.currentTarget.value);
          e.currentTarget.style.height = "auto";
          e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
        }}
      />
      <Button size="lg" type="submit">
        Send
      </Button>
    </form>
  );
}
