"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GETRequest } from "@/lib/server/requests";
import { Lobby } from "@/lib/types/server-response-data";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Snail } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

export default function Page() {
  const { data } = useSession();

  const { data: lobbies } = useQuery({
    enabled: !!data,
    queryKey: ["lobbies", data],
    placeholderData: [],
    queryFn: async () => {
      const {
        data: server_data,
        status,
        message,
      } = await GETRequest<Lobby[]>("/v1/user/lobbies");
      if (status !== "OK") {
        toast.error(message);
        throw new Error(message);
      }

      return server_data;
    },
  });

  return (
    <main className="grow h-full grid grid-rows-[auto_1fr] p-10">
      <h1 className="text-2xl font-semibold">Recent Lobbies</h1>
      <div
        className={cn(
          "h-full w-full flex flex-wrap overflow-y-auto ",
          lobbies?.length && "grid grid-cols-4 p-10 gap-4"
        )}
      >
        {lobbies?.length ? (
          lobbies?.map((lobby) => (
            <Link key={lobby.id} href={"/lobby/" + lobby.id}>
              <Card className="aspect-video">
                <CardHeader>
                  <CardTitle className="text-center">{lobby.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Avatar className="aspect-square h-16 w-auto">
                    <AvatarImage src={lobby.photo.url} />
                    <AvatarFallback>
                      <Snail className="h-1/2 w-auto stroke-1 stroke-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                </CardContent>
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
    </main>
  );
}
