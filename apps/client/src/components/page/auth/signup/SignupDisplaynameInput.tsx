import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function SignupDisplaynameInput() {
  const [display_name_focused, setDisplayNameFocused] = useState(false);

  const query_client = useQueryClient();
  const { data: form } = useQuery<{
    email: string;
    username: string;
    password: string;
    display_name: string;
    confirm_password: string;
    pin: string;
  }>({ queryKey: ["signup", "form"] });

  return (
    <div className="grid gap-2">
      <Label htmlFor="username">Display name</Label>
      <div className="grid gap-1">
        <Input
          id="username"
          placeholder="Display name"
          value={form?.display_name || ""}
          onChange={(e) =>
            query_client.setQueryData<{
              email: string;
              username: string;
              password: string;
              display_name: string;
              confirm_password: string;
              pin: string;
            }>(["signup", "form"], (prev) => {
              if (!prev) return;
              return { ...prev, display_name: e.target.value };
            })
          }
          onFocus={() => setDisplayNameFocused(true)}
          onBlur={() => !form?.display_name && setDisplayNameFocused(false)}
        />
        {display_name_focused && (
          <span data-testid="display-name-info" className="text-xs text-primary">
            This is how others see you
          </span>
        )}
      </div>
    </div>
  );
}
