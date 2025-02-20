import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PATCHRequest } from "@/lib/server/requests";
import { useMutation } from "@tanstack/react-query";
import { AtSign } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SettingsChangeUserName() {
  const [input_is_open, setInputIsOpen] = useState(false);
  const [username, setUsername] = useState("");
  const {
    session: { user, update },
  } = useAuth();

  const change_username = useMutation({
    mutationFn: async () => {
      try {
        const { status, message } = await PATCHRequest("/v1/user/username", {
          username: "@" + username,
        });

        if (status !== "OK") {
          toast.error(message);
          return;
        }
        await update({ username: "@" + username });
      } catch (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      setInputIsOpen(false);
    },
  });

  return (
    <div>
      <span className="font-semibold">Username</span>
      <div>
        {input_is_open ? (
          <form
            className="flex items-center gap-2 relative"
            onSubmit={(e) => {
              e.preventDefault();
              change_username.mutate();
            }}
          >
            <AtSign className="h-4 w-auto absolute top-1/2 left-4 -translate-y-1/2" />
            <Input
              autoFocus
              placeholder="Display name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-8"
            />
            <Button
              type="button"
              variant="outline"
              disabled={change_username.isPending}
              onClick={() => {
                setUsername(user!.username);
                setInputIsOpen(false);
              }}
            >
              cancel
            </Button>
            <Button
              disabled={
                !username ||
                change_username.isPending ||
                username === user?.username.slice(1)
              }
            >
              confirm
            </Button>
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <p className="border rounded-sm p-2 w-full bg-secondary text-sm flex items-center gap-1">
              <AtSign className="h-4 w-auto" />
              <span>{user?.username.slice(1)}</span>
            </p>
            <Button
              type="button"
              disabled={!user}
              variant="outline"
              className=""
              onClick={() => {
                setUsername(user!.username.slice(1));
                setInputIsOpen(true);
              }}
            >
              change
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
