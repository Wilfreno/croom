import LoadingSvg from "@/components/svg/LoadingSvg";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ServerResponse } from "@/lib/types/sever-response";
import { cn } from "@/lib/utils";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { useSession } from "next-auth/react";
import { useState } from "react";

export default function AddFriend() {
  const server_url = process.env.NEXT_PUBLIC_DEVELOPMENT_SERVER!;
  if (!server_url)
    throw new Error("DEVELOPMENT_SERVER is missing from your .env.local file");

  const [username, setUsername] = useState("");
  const [sending, setSending] = useState(false);
  const [server_response, setServerResponse] = useState<ServerResponse>();
  const { data } = useSession();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default" className="text-secondary-foreground">
          Add friend
        </Button>
      </DialogTrigger>
      <DialogContent className="space-y-5">
        <DialogHeader className="relative">
          <DialogClose className="absolute -top-2 -right-2">
            <XMarkIcon className="h-5 " />
          </DialogClose>
          <DialogTitle>Add Friend</DialogTitle>
          <DialogDescription>Add friend with their username</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSending(true);
            const response = await fetch(
              server_url + "/create/friend-request",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  sender: data?.user.user_name,
                  receiver: username,
                }),
              }
            );

            const response_json = (await response.json()) as ServerResponse;
            setServerResponse(response_json);
            setSending(false);
          }}
          autoComplete="off"
        >
          <div className="flex bg-primary-foreground rounded-lg p-2">
            <Input
              placeholder="Add friend with their username"
              id="username"
              className="border-none bg-transparent focus-visible:ring-0"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Button type="submit" disabled={!username} className="w-2/3">
              {sending ? <LoadingSvg className="h-6" /> : "Send Friend request"}
            </Button>
          </div>
          {server_response && (
            <p
              className={cn(
                "text-xs mx-3 my-1",
                server_response.status === "OK"
                  ? "text-green-600 text-xs"
                  : "text-red-600"
              )}
            >
              {server_response.message}
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
