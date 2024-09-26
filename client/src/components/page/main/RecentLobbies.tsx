"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GETRequest, POSTRequest } from "@/lib/server/requests";
import { Lobby } from "@/lib/types/server";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Snail } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function RecentLobbies() {
  const { data } = useSession();
  const router = useRouter();

  const query_client = useQueryClient();
  const { data: lobbies } = useQuery({
    queryKey: ["lobbies", data],
    placeholderData: [],
    queryFn: async () => {
      const {
        data: server_data,
        status,
        message,
      } = await GETRequest<Lobby[]>("/v1/user/" + data!.user.id + "/lobbies");

      console.log(server_data);
      console.log(status);
      console.log(message);
      if (status !== "OK") {
        toast.error(message);
        throw new Error(message);
      }

      return server_data;
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

      query_client.setQueryData(["open_sidebar"], false);
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
      <div
        className={cn(
          "h-full w-full flex",
          lobbies?.length && "grid grid-cols-4 p-5 gap-4"
        )}
      >
        {lobbies?.length ? (
          lobbies?.map((lobby) => (
            <Link key={lobby.id} href={"/lobby/" + lobby.id}>
              <Card className="aspect-video">
                <CardHeader>
                  <CardTitle>{lobby.name}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))
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
