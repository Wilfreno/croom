"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DELETERequest } from "@/lib/server/requests";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export default function SettingsDeleteAccount() {
  const [value, setValue] = useState("");

  const { logout } = useAuth();

  const delete_account = useMutation({
    mutationFn: async () => {
      try {
        const { status, message } = await DELETERequest("/v1/user");

        if (status !== "OK") throw new Error(message);
      } catch (error) {
        toast.error("Oops! something went wrong");
        throw error;
      }
    },
    onSuccess: async () => {
      await logout();
    },
  });
  return (
    <div className="flex items-center justify-between">
      <span className="font-medium">Delete account</span>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="destructive">Delete</Button>
        </DialogTrigger>
        <DialogContent className="w-96 grid gap-4">
          <DialogHeader>
            <DialogTitle>Delete Account your account</DialogTitle>
            <DialogDescription className="text-xs">
              Delete your account by typing <strong>&quot;DELETE&quot;</strong> and
              pressing confirm
            </DialogDescription>
            <div className="grid gap-2">
              <Input
                autoFocus
                autoComplete="off"
                placeholder='Type "DELETE" to confirm'
                value={value}
                onChange={(e) => setValue(e.currentTarget.value)}
              />
              <Button
                disabled={value.toUpperCase() !== "DELETE"}
                variant="destructive"
                className="justify-self-end"
                onClick={() => delete_account.mutate()}
              >
                Confirm
              </Button>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
