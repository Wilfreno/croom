"use client";

import useHTTPRequest from "@/components/hooks/useHTTPRequest";
import LoadingSvg from "@/components/svg/LoadingSvg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User } from "@/lib/types/client-types";
import { UserIcon } from "@heroicons/react/24/solid";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function Page() {
  const router = useRouter();
  const { data, update } = useSession();
  const http_request = useHTTPRequest();

  const [user, setUser] = useState<User>();
  const [display_name_focus, setDisplayNameFocus] = useState(false);
  const [username_focus, setUsernameFocus] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submitUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setLoading(true);
      const new_data = await http_request.POST("/v1/user", {
        email: data?.user.email,
        display_name: user?.display_name,
        user_name: user?.user_name,
        profile_photo: {
          url: data?.user.profile_photo?.url!,
        },
      });
      await update(new_data);
      setLoading(false);
      router.push("/");
    } catch (error) {
      throw error;
    }
  }

  return (
    <section className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg border shadow-lg bg-primary-foreground p-10 space-y-5">
      <div className="grid place-items-center space-y-5">
        <p className="text-2xl font-bold">Welcome</p>
        <Avatar className="aspect-square w-[10vw] h-auto">
          <AvatarImage
            src={data?.user.profile_photo?.url}
            alt={data?.user.email.slice(0, 1).toUpperCase()}
          />
          <AvatarFallback>
            <UserIcon className="h-12 fill-primary" />
          </AvatarFallback>
        </Avatar>
        <p> {data?.user.email}</p>
      </div>
      <form className="space-y-5" onSubmit={submitUser}>
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
              This is how others find you
            </p>
          )}
        </div>
        <Button type="submit" disabled={!user?.display_name} className="w-full">
          {loading ? <LoadingSvg className="h-6 " /> : "Confirm"}
        </Button>
      </form>
    </section>
  );
}
