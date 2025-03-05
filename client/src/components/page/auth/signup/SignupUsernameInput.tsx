import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AtSign } from "lucide-react";
import { useState } from "react";

export default function SignupUsernameInput() {
  const [username_focused, setUsernameFocused] = useState(false);

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
      <Label htmlFor="username">Username</Label>
      <div className="grid gap-1">
        <div className="relative">
          <Input
            className="pl-8"
            id="username"
            placeholder="Username"
            value={form?.username}
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
                return { ...prev, username: e.target.value };
              })
            }
            onFocus={() => setUsernameFocused(true)}
            onBlur={() => !form?.username && setUsernameFocused(false)}
          />
          <AtSign className="h-4 w-auto absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        {username_focused && (
          <span data-testid="username-info" className="text-xs text-primary">
            This is how others find you
          </span>
        )}
      </div>
    </div>
  );
}
