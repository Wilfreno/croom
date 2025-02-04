import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { PATCHRequest } from "@/lib/server/requests";
import { useMutation } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SettingsChangeDisplayname() {
  const [collapsible_is_open, setCollapsibleIsOpen] = useState(false);
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

        if (status !== "OK") toast.error(message);
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
    <Collapsible onOpenChange={setCollapsibleIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between">
          <span>Change display name</span>
          {collapsible_is_open ? (
            <ChevronDown className="h-4 w-auto" />
          ) : (
            <ChevronRight className="h-4 w-auto" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
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
      </CollapsibleContent>
    </Collapsible>
  );
}
