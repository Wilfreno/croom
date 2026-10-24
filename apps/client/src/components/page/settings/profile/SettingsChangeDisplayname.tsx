import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PATCHRequest } from "@/lib/server/requests";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export default function SettingsChangeDisplayname() {
  const [inputIsOpen, setInputIsOpen] = useState(false);
  const [displayName, setDisplayname] = useState("");
  const {
    session: { user, update },
  } = useAuth();

  const changeDisplayName = useMutation({
    mutationFn: async () => {
      try {
        const { status, message } = await PATCHRequest("/v1/user/display_name", {
          displayName,
        });

        if (status !== "OK") {
          toast.error(message);
          return;
        }
        await update({ displayName });
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
      <span className="font-semibold">Display name</span>
      {inputIsOpen ? (
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            changeDisplayName.mutate();
          }}
        >
          <Input
            autoFocus
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayname(e.target.value)}
          />
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              setDisplayname(user!.displayName);
              setInputIsOpen(false);
            }}
          >
            cancel
          </Button>
          <Button disabled={changeDisplayName.isPending}>confirm</Button>
        </form>
      ) : (
        <div className="flex items-center gap-2">
          <span className="border rounded-sm p-2 w-full bg-secondary text-sm">
            {user?.displayName}
          </span>
          <Button
            type="button"
            disabled={!user}
            variant="outline"
            className=""
            onClick={() => {
              setDisplayname(user!.displayName);
              setInputIsOpen(true);
            }}
          >
            change
          </Button>
        </div>
      )}
    </div>
  );
}
