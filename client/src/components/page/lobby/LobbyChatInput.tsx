import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { POSTRequest } from "@/lib/server/requests";
import { Message } from "@/lib/types/server";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import React, { useRef, useState } from "react";
import { toast } from "sonner";

export default function LobbyChatInput() {
  const [text, setText] = useState("");

  const params = useParams<{ id: string }>();
  const textarea_ref = useRef<HTMLTextAreaElement>(null);
  const query_client = useQueryClient();

  const messages_mutation = useMutation({
    mutationFn: async () => {
      const { data, status, message } = await POSTRequest<Message>(
        "/v1/message",
        {
          lobby_id: params.id,
          message: text,
        }
      );

      if (status !== "CREATED") {
        toast.error(message);
        throw new Error(message);
      }

      return data;
    },
    onSuccess: (message) => {
      query_client.setQueryData<Message[]>(["message", params.id], (prev) =>
        prev ? [...prev, message] : []
      );
      textarea_ref.current!.style.height = "auto";
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        messages_mutation.mutate();
      }}
      autoComplete="off"
      className="grid gap-2 p-1 bg-secondary"
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
      <Button size="lg" type="submit" className="justify-self-end">
        Send
      </Button>
    </form>
  );
}
