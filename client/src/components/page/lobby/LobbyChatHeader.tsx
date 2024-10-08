import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GETRequest, PATCHRequest, POSTRequest } from "@/lib/server/requests";
import { Invite, Lobby, ServerResponse } from "@/lib/types/server";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, Info, Plus, Snail } from "lucide-react";
import { useSession } from "next-auth/react";
import { notFound, useParams } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";
import LobbyInvite from "./LobbyInvites";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function LobbyChatHeader() {
  const params = useParams<{ id: string }>();
  const { data: session } = useSession();

  const query_client = useQueryClient();

  const {
    data: lobby,
    refetch: refetchLobby,
    error,
  } = useQuery({
    queryKey: ["lobby", params.id],
    queryFn: async () => {
      const { data, message, status } = await GETRequest<Lobby>(
        "/v1/lobby/" + params.id
      );

      if (status !== "OK") {
        throw new Error(message);
      }

      return data;
    },
  });

  const is_admin = useMemo(() => {
    if (!lobby || !session) return false;

    return (
      lobby.members.find((member) => member.user.id === session.user.id)
        ?.role === "ADMIN"
    );
  }, [lobby, session]);

  const { data: invites, isFetching } = useQuery({
    enabled: is_admin,
    queryKey: ["invites", lobby?.id],
    queryFn: async () => {
      const {
        data: server_data,
        status,
        message,
      } = await GETRequest<Invite[]>("/v1/lobby/" + lobby?.id + "/invites");

      if (status !== "OK") {
        toast.error(message);
        throw new Error(message);
      }

      return server_data;
    },
    placeholderData: [],
  });

  const createInviteMutation = useMutation({
    mutationFn: async () => {
      const {
        data: server_data,
        status,
        message,
      } = await POSTRequest<Invite>("/v1/invite", {
        lobby_id: lobby?.id,
      });

      if (status !== "CREATED") {
        toast.error(message);
        throw new Error(message);
      }

      return server_data;
    },
    onSuccess: (server_data) => {
      query_client.setQueryData<Invite[]>(["invites", lobby?.id], (old_data) =>
        old_data ? [...old_data!, server_data] : [server_data]
      );
    },
  });

  async function updateLobbyAccessibility(is_private: boolean) {
    if (lobby?.is_private === is_private) return;

    const { status, message } = await PATCHRequest("/v1/lobby/is_private", {
      id: lobby!.id,
      is_private,
    });

    if (status !== "OK") {
      toast.error(message);
      throw new Error(message);
    }

    await refetchLobby();
  }

  if (error) throw error;
  return (
    <header className="w-full h-full flex items-center justify-between px-10">
      <h1 className="tex-4xl font-semibold">{lobby?.name}</h1>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            size="icon"
            className={cn("p-1", is_admin ? "inline-flex" : "hidden")}
          >
            <Plus className="h-4 w-auto" />
          </Button>
        </DialogTrigger>
        <DialogContent className="aspect-video h-auto w-[70vw] flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="gap-8 flex">
              <span>Invite people in your lobby</span>
              <span className="flex items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Badge className="flex gap-2" variant="secondary">
                      <span className="font-semibold">
                        {lobby?.is_private ? "PRIVATE" : "PUBLIC"}
                      </span>
                      <ChevronDown className="h-4" />
                    </Badge>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        onClick={() => updateLobbyAccessibility(true)}
                        className="flex justify-between cursor-pointer"
                      >
                        <span>Private</span>
                        {lobby?.is_private && (
                          <Check className="stroke-green-500 h-4 w-auto" />
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateLobbyAccessibility(false)}
                        className="flex  justify-between cursor-pointer"
                      >
                        <span>Public</span>

                        {!lobby?.is_private && (
                          <Check className="stroke-green-500 h-4 w-auto" />
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                {lobby?.is_private && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="rounded-full">
                        <Info className="h-4 w-auto" />
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        Your lobby is <strong>private</strong>, only invited
                        user can access your invitation
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </span>
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogHeader>
          {!!invites?.length && (
            <Button
              className="mr-auto"
              onClick={() => createInviteMutation.mutate()}
            >
              Add invite
            </Button>
          )}
          {isFetching ? (
            <Snail className="h-24 w-auto m-auto stroke-1 stroke-muted-foreground mx-auto" />
          ) : invites!.length ? (
            <ScrollArea className="h-[60dvh]">
              <section className="grid gap-2">
                {invites?.map((invite) => (
                  <LobbyInvite key={invite.id} invite={invite} />
                ))}
              </section>
            </ScrollArea>
          ) : (
            <div className="grid place-items-center h-full">
              <div className="grid place-items-center gap-2">
                <Snail className="h-24 w-auto m-auto stroke-1 stroke-muted-foreground" />
                <p className="font-medium text-muted-foreground">no invites</p>
                <Button onClick={() => createInviteMutation.mutate()}>
                  Generate invite
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </header>
  );
}
