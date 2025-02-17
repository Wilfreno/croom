"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PATCHRequest } from "@/lib/server/requests";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function SettingsChangePassword() {
  const [password, setPassword] = useState({ new: "", confirm: "" });
  const [see_password, setSeePassword] = useState([false, false]);
  const [open, setOpen] = useState(false);

  const div_ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) div_ref.current?.scrollIntoView();
  }, [open]);

  const change_password = useMutation({
    mutationFn: async () => {
      try {
        const { status, message } = await PATCHRequest("/v1/user/password", {
          password,
        });

        if (status !== "OK") throw new Error(message);
      } catch (error) {
        toast.error("Oops! something went wrong");
        throw error;
      }
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-semibold">Password</span>
        <Button
          variant="outline"
          onClick={() => {
            if (open) {
              setPassword({ new: "", confirm: "" });
              setSeePassword([false, false]);
            }
            setOpen((prev) => !prev);
          }}
        >
          {open ? "Cancel" : "Change"}
        </Button>
      </div>
      <div ref={div_ref} className={cn(open ? "grid gap-2 relative" : "hidden")}>
        <div className="space-y-1">
          <Label htmlFor="current-pass" className="font-medium">
            New Password
          </Label>
          <div className="relative">
            <Input
              id="current-pass"
              type={see_password[0] ? "text" : "password"}
              placeholder="New Password"
              value={password.new}
              onChange={(e) => setPassword((prev) => ({ ...prev, new: e.target.value }))}
            />
            <Button
              variant="ghost"
              className="aspect-square h-8 p-2 w-auto absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => setSeePassword((prev) => [!prev[0], prev[1]])}
            >
              {see_password[0] ? (
                <Eye className="h-full w-auto" />
              ) : (
                <EyeOff className="h-full w-auto" />
              )}
            </Button>
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="current-pass" className="font-medium">
            Confirm Password
          </Label>
          <div className="relative">
            <Input
              id="current-pass"
              type={see_password[1] ? "text" : "password"}
              placeholder="Confirm Password"
              value={password.confirm}
              onChange={(e) =>
                setPassword((prev) => ({ ...prev, confirm: e.target.value }))
              }
            />
            <Button
              variant="ghost"
              className="aspect-square h-8 p-2 w-auto absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => setSeePassword((prev) => [prev[0], !prev[1]])}
            >
              {see_password[1] ? (
                <Eye className="h-full w-auto" />
              ) : (
                <EyeOff className="h-full w-auto" />
              )}
            </Button>
          </div>
        </div>
        {password.new !== password.confirm && (
          <span className="text-xs font-medium text-destructive">
            Password is not the same
          </span>
        )}
        <Button
          disabled={
            !password.new ||
            !password.confirm ||
            password.new !== password.confirm ||
            change_password.isPending
          }
          className="justify-self-end"
          onClick={() => change_password.mutate()}
        >
          Confirm
        </Button>
      </div>
    </div>
  );
}
