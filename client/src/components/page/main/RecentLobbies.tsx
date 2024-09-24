"use client";
import { Button } from "@/components/ui/button";
import { GETRequest, POSTRequest } from "@/lib/server/requests";
import { Lobby } from "@/lib/types/server";
import { useQuery } from "@tanstack/react-query";
import { Plus, Snail } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function RecentLobbies() {
  const { data } = useSession();
  const router = useRouter();

  const { data: lobbies } = useQuery({
    enabled: !!data,
    queryKey: ["lobbies", data],
    queryFn: async () => {
      const {
        data: lobbies,
        status,
        message,
      } = await GETRequest<Lobby[]>("/v1/user/" + data!.user.id + "/lobbies");

      if (status !== "OK") {
        toast.error(message);
        throw new Error(message);
      }

      return lobbies;
    },
  });

  async function createLobby() {
    try {
      const {
        data: new_lobby,
        status,
        message,
      } = await POSTRequest<Lobby>("/v1/lobby");

      if (status !== "CREATED") {
        toast.error(message);
        throw new Error(message);
      }

      router.push("/lobby/" + new_lobby.id);
    } catch (error) {
      toast.error("something went wrong");
      throw error;
    }
  }
  return (
    <div className="grow h-full grid grid-rows-[auto_1fr]">
      <div className="flex items-center gap-8">
        <h1 className="text-2xl font-semibold">Recent Lobbies</h1>
        <Button className="gap-1" size="sm" onClick={createLobby}>
          <span>Create</span> <Plus className="h-4" />
        </Button>
      </div>
      <div className="h-full w-full flex ">
        {lobbies?.length ? (
          <></>
        ) : (
          <span className="m-auto text-center text-muted-foreground font-medium grid">
            <Snail className="h-24 w-auto stroke-muted-foreground stroke-1 mx-auto" />
            <p>There&apos;s nothing to see here</p>
          </span>
        )}
      </div>
    </div>
  );
}
