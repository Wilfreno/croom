"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { User } from "@/lib/types/user-type";
import { cn } from "@/lib/utils";
import { DialogTitle } from "@radix-ui/react-dialog";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

export default function NewUser() {
  const { data } = useSession();
  const [user, setUser] = useState<User>();
  const [form_index, setFormIndex] = useState(0);
  return (
    <Dialog open={!data?.user.user_name || !data?.user.display_name}>
      <DialogContent className="p-10 space-y-5">
        <DialogHeader className="grid place-items-center ">
          <p className="text-2xl font-bold">Welcome</p>
          <p> {data?.user.email}</p>
        </DialogHeader>
        <p className="text-sm">
          Provide your bellow Display name so everyone know it's you.
        </p>
        <div className={cn("space-y-5", form_index !== 0 && "hidden")}>
          <Avatar>
            <AvatarImage src={data?.user.profile_pic?.photo_url} />
          </Avatar>
        </div>
        <div>
          <p className="text-sm">
            Provide your bellow Display name so everyone know it's you.
          </p>
          <Input
            placeholder="Display name"
            value={user?.display_name}
            onChange={(e) =>
              setUser((prev) => ({ ...prev!, display_name: e.target.value }))
            }
            className="text-base py-5"
          />
          <Button
            type="button"
            disabled={!user?.display_name}
            className="w-full"
            onClick={() => setFormIndex((prev) => prev + 1)}
          >
            Confim
          </Button>
          <Button onClick={async () => await signOut()}>logout</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
