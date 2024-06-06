"use client";

import useServerUrl from "@/components/hooks/useServerUrl";
import LoadingSvg from "@/components/svg/LoadingSvg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User } from "@/lib/types/client-types";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function Page() {
  const development_server = useServerUrl();
  const router = useRouter();
  const { data, update } = useSession();
  const [user, setUser] = useState<User>();
  const [display_name_focus, setDisplayNameFocus] = useState(false);
  const [username_focus, setUsernameFocus] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submitUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch(development_server + "/create/v1/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data?.user.email,
          display_name: user?.display_name,
          user_name: user?.user_name,
          profile_photo: {
            photo_url: data?.user.profile_photo?.photo_url!,
          },
        }),
      });

      const response_json = await response.json();

      await update(response_json.data);
      setLoading(false);
      router.push("/");
    } catch (error) {
      throw error;
    }
  }

  console.log("Sesion::", data);
  return (
    <section className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg border shadow-lg bg-primary-foreground p-10 space-y-5">
      <div className="grid place-items-center space-y-5">
        <p className="text-2xl font-bold">Welcome</p>
        <Avatar className="aspect-square w-[10vw] h-auto">
          <AvatarImage
            src={data?.user.profile_photo?.photo_url}
            alt={data?.user.email.slice(0, 1).toUpperCase()}
          />
          <AvatarFallback>
            data?.user.email.slice(0, 1).toUpperCase()
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
