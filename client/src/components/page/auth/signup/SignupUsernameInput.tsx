import useDebounce from "@/components/hooks/useDebounce";
import Loading from "@/components/svg/Loading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GETRequest } from "@/lib/server/requests";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AtSign } from "lucide-react";
import { useEffect, useState } from "react";

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

  const { data: username_check } = useQuery<{ checking: boolean; status?: "ALREADY_USED" | "AVAILABLE" }>({
    queryKey: ["signup", "form", "username", "check"],
    queryFn: () => ({ checking: false }),
  });
  const debounced_username = useDebounce(form?.username);

  useEffect(() => {
    if (!debounced_username) {
      query_client.setQueryData<{ checking: boolean; status?: "ALREADY_USED" | "AVAILABLE" }>(
        ["signup", "form", "username", "check"],
        (prev) => {
          if (!prev) return;
          return { checking: false };
        }
      );

      return;
    }

    async function checkUsernameIfAlreadyUsed() {
      try {
        query_client.setQueryData<{ checking: boolean; status?: "ALREADY_USED" | "AVAILABLE" | "INVALID" }>(
          ["signup", "form", "username", "check"],
          (prev) => {
            if (!prev) return;

            return { ...prev, checking: true };
          }
        );

        const { status, message } = await GETRequest("/v1/user/check/username/@" + debounced_username);

        if (status === "OK") {
          query_client.setQueryData<{ checking: boolean; status?: "ALREADY_USED" | "AVAILABLE" }>(
            ["signup", "form", "username", "check"],
            (prev) => {
              if (!prev) return;

              return { checking: false, status: "ALREADY_USED" };
            }
          );

          return;
        }
        query_client.setQueryData<{ checking: boolean; status?: "ALREADY_USED" | "AVAILABLE" }>(
          ["signup", "form", "username", "check"],
          (prev) => {
            if (!prev) return;

            return { checking: false, status: "AVAILABLE" };
          }
        );

        if (status !== "NOT_FOUND") {
          console.log({ status, message });
          return;
        }
      } catch (error) {
        throw error;
      }
    }

    checkUsernameIfAlreadyUsed();
  }, [debounced_username]);

  return (
    <div className="grid gap-2">
      <Label htmlFor="username">Username</Label>
      <div className="grid gap-1">
        <div className="relative">
          <Input
            className={cn(
              "pl-8",
              username_check?.status === "ALREADY_USED" && "border-destructive focus-visible:ring-destructive",
              username_check?.status === "AVAILABLE" && "border-green-500 focus-visible:ring-green-500"
            )}
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
          {username_check?.checking && <Loading className="aspect-square h-4 w-auto" />}
        </div>
        {username_check?.status === "ALREADY_USED" && (
          <span data-testid="username-already-used" className="text-xs text-destructive">
            username already used
          </span>
        )}

        {username_check?.status === "AVAILABLE" && (
          <span data-testid="username-available" className="text-xs text-green-500">
            username is available
          </span>
        )}
        {username_focused && (
          <span data-testid="username-info" className="text-xs text-primary">
            This is how others find you
          </span>
        )}
      </div>
    </div>
  );
}
