"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadthingButton } from "@/components/providers/UploadThingButton";
import { PATCHRequest } from "@/lib/server/requests";
import { User } from "@/lib/types/server-response-data";
import { cn } from "@/lib/utils";
import { AtSign, UserRound } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function UpdateAccountForm() {
  const [photo_url, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [display_name, setDisplayName] = useState("");
  const [username, setUserName] = useState("");
  const [updating, setUpdating] = useState(false);

  const { data, update } = useSession();
  const router = useRouter();
  const from = useSearchParams().get("from");
  useEffect(() => {
    if (data) {
      if (data.user.photo) {
        setPhotoUrl(data.user.photo.url);
      }
      setDisplayName(data.user.display_name);
      setUserName(data.user.username.substring(1));
    }
  }, [data]);
  let path = "/";

  if (from) path = from;

  return (
    <form
      autoComplete="off"
      className="justify-self-center grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setUpdating(true);
        const {
          status: new_user_photo_status,
          message: new_user_photo_message,
        } = await PATCHRequest<User>("/v1/user/photo", {
          id: data?.user.id,
          photo: {
            url: photo_url,
          },
        });

        if (new_user_photo_status !== "OK") {
          toast.warning(new_user_photo_message);
          return;
        }

        const {
          status: new_user_display_name_status,
          message: new_user_display_name_message,
        } = await PATCHRequest<User>("/v1/user/display_name", {
          id: data?.user.id,
          display_name,
        });

        if (new_user_display_name_status !== "OK") {
          toast.warning(new_user_display_name_message);
          return;
        }

        const {
          status: new_user_username_status,
          message: new_user_username_message,
        } = await PATCHRequest<User>("/v1/user/username", {
          id: data?.user.id,
          username: "@" + username,
        });

        if (new_user_username_status !== "OK") {
          toast.warning(new_user_username_message);
          return;
        }
        const {
          data: old_user,
          status: old_user_status,
          message: old_user_message,
        } = await PATCHRequest<User>("/v1/user/is_new", {
          id: data?.user.id,
          is_new: false,
        });

        if (old_user_status !== "OK") {
          toast.warning(old_user_message);
          return;
        }
        await update(old_user);

        router.push(path);
      }}
    >
      <section className="mx-auto space-y-4 grid place-items-center">
        <Avatar className="aspect-square w-56 h-auto">
          <AvatarImage src={photo_url} />
          <AvatarFallback>
            <UserRound className="h-full w-auto p-5" />
          </AvatarFallback>
        </Avatar>
        <UploadthingButton
          endpoint="imageUploader"
          className={cn(
            "ut-allowed-content:hidden",
            "ut-button:underline-offset-4 ut-button:hover:bg-secondary ut-button:text-primary ut-button:bg-background ut-button:focus-within:ring-0 ut-button:focus-within:ring-offset-0 ut-button:after:ut-uploading:bg-primary"
          )}
          content={{
            button({ ready, isUploading }) {
              if (photo_url) return <span>Change Photo</span>;

              let e = <span>Upload Photo</span>;
              if (isUploading)
                e = <span className="z-50 text-primary">...</span>;

              if (!ready) e = <span>...</span>;

              return e;
            },
          }}
          onClientUploadComplete={(response) => {
            setPhotoUrl(response[0].url);
            setUploading(false);
          }}
          onUploadError={(e) => {
            toast.error(e.message);
          }}
          onUploadBegin={() => setUploading(true)}
        />
      </section>
      <section className="space-y-3 ">
        <div>
          <Label htmlFor="display-name">Display Name</Label>
          <Input
            id="display-name"
            placeholder="Display Name"
            value={display_name}
            onChange={(e) => setDisplayName(e.currentTarget.value)}
          />
        </div>
        <div>
          <Label htmlFor="username">User Name</Label>
          <div className="relative">
            <AtSign className="h-5 w-auto absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              id="username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUserName(e.currentTarget.value)}
              className="pl-10"
            />
          </div>
        </div>
      </section>
      <Button disabled={updating}>Confirm</Button>
    </form>
  );
}
