import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PATCHRequest } from "@/lib/server/requests";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export default function SettingsChangeDisplayname() {
  const [input_is_open, setInputIsOpen] = useState(false);
  const [display_name, setDisplayname] = useState("");
  const {
    session: { user, update },
  } = useAuth();

  const change_display_name = useMutation({
    mutationFn: async () => {
      try {
        const { status, message } = await PATCHRequest("/v1/user/display_name", {
          display_name,
        });

        if (status !== "OK") {
          toast.error(message);
          return;
        }
        await update({ display_name });
      } catch (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      setInputIsOpen(false);
    },
  });

  return (
    <section>
      <span className="font-semibold">Display name</span>
      {input_is_open ? (
        <form
          className="flex items-center gap-2 p-2"
          onSubmit={(e) => {
            e.preventDefault();
            change_display_name.mutate();
          }}
        >
          <Input
            autoFocus
            placeholder="Display name"
            value={display_name}
            onChange={(e) => setDisplayname(e.target.value)}
          />
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              setDisplayname(user!.display_name);
              setInputIsOpen(false);
            }}
          >
            cancel
          </Button>
          <Button disabled={change_display_name.isPending}>confirm</Button>
        </form>
      ) : (
        <div className="flex items-center gap-2 p-2">
          <span className="border rounded-sm p-2 w-full bg-secondary text-sm">
            {user?.display_name}
          </span>
          <Button
            type="button"
            disabled={!user}
            variant="outline"
            className=""
            onClick={() => {
              setDisplayname(user!.display_name);
              setInputIsOpen(true);
            }}
          >
            change
          </Button>
        </div>
      )}
    </section>
  );
}
