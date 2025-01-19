import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Conversation } from "@/lib/types/server-data-types";
import { getConvoOptions } from "@/lib/react-query/prefetch-query-options";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserRound, UserRoundPlus, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { PATCHRequest } from "@/lib/server/requests";
import { useAuth } from "@/components/providers/AuthProvider";

export default function ManageAdmin() {
  const { session } = useAuth();

  const params = useParams<{ id: string }>();
  const { data: conversation } = useQuery<Conversation>(getConvoOptions(params.id));
  const query_client = useQueryClient();

  const is_admin = useMemo(() => {
    if (!conversation || !session) return false;
    return conversation.admins.some((user) => user.id === session.user?.id);
  }, [session, conversation]);

  const manage_admin = useMutation<
    void,
    Error,
    { admin: string; admin_action: "ADD" | "REMOVE" }
  >({
    mutationFn: async ({ admin, admin_action }) => {
      try {
        const { message, status } = await PATCHRequest(
          "/v1/conversation/" + params.id + "/admins",
          {
            admin_action,
            admin,
          }
        );
        if (status !== "OK") throw new Error(message);
      } catch (error) {
        toast.error((error as Error).message);
      }
    },
    onSuccess: (_, { admin, admin_action }) => {
      query_client.setQueryData<Conversation>(["conversation", params.id], (prev) => {
        if (!prev) return;

        switch (admin_action) {
          case "ADD": {
            return {
              ...prev,
              admins: [...prev.admins, prev.members.find((user) => user.id === admin)!],
            };
          }
          case "REMOVE":
            return { ...prev, admins: prev.admins.filter((user) => user.id !== admin) };
        }
      });
    },
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          className={cn(is_admin ? "w-full p-2  font-medium text-primary" : "hidden")}
          disabled={!is_admin}
        >
          <span className="aspect-square h-fit w-auto rounded-full p-2 ">
            <UserRoundPlus className="h-4 w-auto" />
          </span>
          <span>Manage admin</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-8 w-[40dvw]">
        <DialogHeader>
          <DialogTitle>Manage admin</DialogTitle>
        </DialogHeader>
        <DialogClose asChild className="absolute top-2 right-2">
          <Button variant="ghost" className="aspect-square h-fit w-auto p-2 rounded-full">
            <X className="h-4 w-auto" />
          </Button>
        </DialogClose>
        <ScrollArea className="h-[40dvh]">
          <div className="grid gap-2">
            {conversation?.members.map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage src={user.photo?.id} />
                    <AvatarFallback>
                      <UserRound className="h-1/2 w-auto" />
                    </AvatarFallback>
                  </Avatar>
                  <p className="truncate max-w-80">{user.display_name}</p>
                </div>
                {user.id === session.user?.id ? (
                  <p className="text-xs font-semibold text-muted-foreground mr-4">You</p>
                ) : conversation?.admins.some((admin) => admin.id === user.id) ? (
                  <Button
                    disabled={manage_admin.isPending}
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      manage_admin.mutate({ admin: user.id, admin_action: "REMOVE" })
                    }
                  >
                    Remove
                  </Button>
                ) : (
                  <Button
                    disabled={manage_admin.isPending}
                    size="sm"
                    onClick={() =>
                      manage_admin.mutate({ admin: user.id, admin_action: "ADD" })
                    }
                  >
                    Add
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
