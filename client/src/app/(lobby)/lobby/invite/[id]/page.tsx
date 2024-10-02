"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GETRequest, POSTRequest } from "@/lib/server/requests";
import { Invite } from "@/lib/types/server";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Snail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function Page({ params }: { params: { id: string } }) {
  const [input_token, setInputToken] = useState();

  const token = useSearchParams().get("token");
  const router = useRouter();

  const { data: invite } = useQuery({
    queryKey: ["invite", params.id],
    queryFn: async () => {
      const {
        data: result,
        status,
        message,
      } = await GETRequest<Invite>("/v1/invite/" + params.id);

      if (status !== "OK") {
        toast.error(message);
        throw new Error(message);
      }
      return result;
    },
  });

  const joinLobbyMutation = useMutation({
    mutationFn: async () => {
      const { status, message } = await POSTRequest("/v1/invite/accept", {
        token: token ? token : input_token,
        lobby_id: invite?.lobby.id,
      });

      if (status !== "OK") {
        toast.error(message);
        throw new Error(message);
      }

      return;
    },
    onSuccess: () => {
      router.push("/lobby/" + invite?.lobby.id);
    },
  });

  return (
    <div className="grow h-dvh flex flex-col items-center justify-center gap-12">
      <span className="text-center space-y-8">
        <Avatar className="aspect-square h-32 w-auto mx-auto">
          <AvatarImage src={invite?.lobby.photo?.url} />
          <AvatarFallback>
            <Snail className="h-1/2 w-auto stroke-1 stroke-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <span className="flex flex-col gap-4">
          <h1 className="text-3xl text-primary font-bold">
            {!!token && <span>You are invited to</span>} join
          </h1>
          <p className="text-6xl secondary-foreground font-bold">
            {invite?.lobby.name}
          </p>
        </span>
      </span>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          joinLobbyMutation.mutate();
        }}
      >
        {token ? (
          <Button size="lg">Accept</Button>
        ) : (
          <div className="flex items-center gap-4">
            <Input placeholder="Invite token" />
            <Button>Join</Button>
          </div>
        )}
      </form>
    </div>
  );
}
