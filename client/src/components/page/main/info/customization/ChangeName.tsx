"use client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { getConvoOptions } from "@/lib/react-query/prefetch-query-options";
import { Conversation } from "@/lib/types/server-data-types";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { useMemo } from "react";

export default function ChangeName() {
  const params = useParams<{ id: string }>();

  const { data: session } = useSession();
  const { data: conversation } = useQuery<Conversation>(getConvoOptions(params.id));

  const is_admin = useMemo(() => {
    if (!session || !conversation) return false;

    return conversation.admins.some((user) => user.id === session.user.id);
  }, [session, conversation]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" disabled={!is_admin}>
          Change chat name
        </Button>
      </DialogTrigger>
      <DialogContent></DialogContent>
    </Dialog>
  );
}
