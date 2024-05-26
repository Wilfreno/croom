"use client";

import LoadingSvg from "@/components/svg/LoadingSvg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { User } from "@/lib/types/user-type";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function page() {
  const development_server = process.env.NEXT_PUBLIC_DEVELOPMENT_SERVER;
  if (!development_server)
    throw new Error(
      "NEXT_PUBLIC_DEVELOPMENT_SERVER is missing from your .env.local file"
    );

  const router = useRouter();
  const { data, update } = useSession();
  const [user, setUser] = useState<User>();
  const [display_name_focus, setDisplayNameFocus] = useState(false);
  const [username_focus, setUsernameFocus] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submitUser() {
    try {
      setLoading(true);
      const response = await fetch(development_server + "/create/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data?.user.email,
          display_name: user?.display_name,
          user_name: user?.user_name,
          profile_pic: {
            photo_url: data?.user.profile_pic?.photo_url!,
          },
        }),
      });

      const response_json = await response.json();

      await update(response_json.data);
      setLoading(false);
      router.refresh();
    } catch (error) {
      throw error;
    }
  }

  return (
    <Dialog open={!!data?.user.provider}>
      <DialogContent className="p-10 space-y-5" tabIndex={-1}>
        <DialogHeader
          className="grid place-items-center space-y-5"
          tabIndex={-1}
        >
          <p className="text-2xl font-bold">Welcome</p>
          <Avatar className="aspect-square w-[10vw] h-auto">
            <AvatarImage
              src={data?.user.profile_pic?.photo_url}
              alt={data?.user.email.slice(0, 1).toUpperCase()}
            />
            <AvatarFallback>
              data?.user.email.slice(0, 1).toUpperCase()
            </AvatarFallback>
          </Avatar>
          <p> {data?.user.email}</p>
        </DialogHeader>
        <div className="space-y-5">
          <div>
            <Input
              placeholder="Display name"
              value={user?.display_name}
              onChange={(e) =>
                setUser((prev) => ({ ...prev!, display_name: e.target.value }))
              }
              onFocus={() => {
                setDisplayNameFocus(true);
                setUsernameFocus(false);
              }}
              className="text-base py-5"
            />
            {display_name_focus && (
              <p className="text-sm text-primary px-2">
                This is what others see you as
              </p>
            )}
          </div>
          <div>
            <Input
              placeholder="Username"
              value={user?.user_name}
              onChange={(e) =>
                setUser((prev) => ({ ...prev!, user_name: e.target.value }))
              }
              onFocus={() => {
                setUsernameFocus(true);
                setDisplayNameFocus(false);
              }}
              className="text-base py-5"
            />
            {username_focus && (
              <p className="text-sm text-primary px-2">
                This how others find you
              </p>
            )}
          </div>
          <Button
            type="button"
            disabled={!user?.display_name}
            className="w-full"
            onClick={submitUser}
          >
            {loading ? <LoadingSvg className="h-6 " /> : "Confirm"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
