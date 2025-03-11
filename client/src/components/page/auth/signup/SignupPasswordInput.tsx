import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function SignupPasswordInput() {
  const [see_password, setSeePassword] = useState([false, false]);

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
    <>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <div className="grid gap-1">
          <div>
            <div className="relative">
              <Input
                type={see_password[0] ? "text" : "password"}
                id="password"
                placeholder="Password"
                value={form?.password}
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
                    return { ...prev, password: e.target.value };
                  })
                }
              />
              <Button
                data-testid="see-password-1"
                type="button"
                variant="ghost"
                size="icon"
                className="h-full w-auto p-2  absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setSeePassword((prev) => [!prev[0], prev[1]])}
              >
                {see_password[0] ? (
                  <Eye data-testid="eye-on-1" className="h-full w-auto" />
                ) : (
                  <EyeOff data-testid="eye-off-1" className="h-full w-auto" />
                )}
              </Button>
            </div>
            {form?.password && form?.password.length < 8 && (
              <span data-testid="short-password-message" className="text-xs text-muted-foreground text-red-500">
                Password must be at least 8 characters long
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <div className="grid gap-1">
          <div className="relative">
            <Input
              type={see_password[1] ? "text" : "password"}
              id="confirm-password"
              placeholder="Confirm Password"
              value={form?.confirm_password}
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
                  return {
                    ...prev,
                    confirm_password: e.target.value,
                  };
                })
              }
            />
            <Button
              data-testid="see-password-2"
              type="button"
              variant="ghost"
              size="icon"
              className="h-full w-auto p-2 absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => setSeePassword((prev) => [prev[0], !prev[1]])}
            >
              {see_password[1] ? (
                <Eye data-testid="eye-on-2" className="h-full w-auto" />
              ) : (
                <EyeOff data-testid="eye-off-2" className="h-full w-auto" />
              )}
            </Button>
          </div>
          {form?.confirm_password && form?.password !== form?.confirm_password && (
            <span data-testid="password-not-same" className="text-xs text-muted-foreground text-red-500">
              Password is not the same
            </span>
          )}
        </div>
      </div>
    </>
  );
}
