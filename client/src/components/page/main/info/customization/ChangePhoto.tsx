"use client";
import { UploadthingButton } from "@/components/page/UploadthingButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getConvoOptions } from "@/lib/react-query/prefetch-query-options";
import { ServerResponse } from "@/lib/server/requests";
import { Conversation } from "@/lib/types/server-data-types";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image as ImageIcon, UserRound } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ClientUploadedFileData } from "uploadthing/types";

export default function ChangePhoto() {
  const [open, setOpen] = useState(false);
  const [new_photo, setNewPhoto] = useState<{ key: string; url: string; width: number; height: number }>();
  const [uploading_image, setUploadingImage] = useState(false);

  const params = useParams<{ id: string }>();
  const { data: conversation } = useQuery<Conversation>(getConvoOptions(params.id));
  const query_client = useQueryClient();

  const delete_photo = useMutation<void, Error, string>({
    mutationFn: async (key) => {
      try {
        const response = await fetch("/api/photo", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ key }),
        });

        const { status, message } = (await response.json()) as ServerResponse;
        if (status !== "OK") throw new Error(message);
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
  });
  async function onClientUploadComplete(
    response: ClientUploadedFileData<{
      photo_url: string;
    }>[]
  ) {
    if (new_photo) {
      delete_photo.mutate(new_photo.key);
    }
    for (const res of response) {
      try {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
          const new_image = new Image();
          new_image.onload = () => resolve(new_image);
          new_image.onerror = (err) => reject(err);
          new_image.src = res.url;
        });
        setNewPhoto({ key: res.key, url: res.url, width: image.width, height: image.height });
      } catch (error) {
        toast.error((error as Error).message);
        return;
      }
    }
    setUploadingImage(false);
  }

  return (
    <Dialog open={open}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start" onClick={() => setOpen((prev) => !prev)}>
          <span className="aspect-square h-fit w-auto p-2 rounded-full bg-secondary text-primary">
            <ImageIcon className="h-4 w-auto" />
          </span>
          <span>Change photo</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="text-center">
          <DialogTitle>Change Photo</DialogTitle>
        </DialogHeader>
        <section className="grid justify-center my-10 gap-4">
          <Avatar className={cn("aspect-square h-auto w-48", uploading_image && "animate-pulse")}>
            <AvatarImage src={new_photo ? new_photo.url : conversation?.photo?.url} />
            <AvatarFallback>
              <UserRound className="h-1/2 w-auto" />
            </AvatarFallback>
          </Avatar>
          <UploadthingButton
            disabled={uploading_image}
            endpoint="single_image"
            className="ut-button:h-fit ut-button:w-auto ut-button:p-2  ut-button:text-primary  ut-button:font-medium  ut-button:bg-background ut-allowed-content:hidden ut-button:focus-within:ring-offset-0  ut-button:focus-within:ring-0 ut-button:after:ut-uploading:bg-transparent"
            content={{
              button() {
                return "Upload";
              },
            }}
            onClientUploadComplete={onClientUploadComplete}
            onUploadError={(e) => {
              toast.error(e.message);
            }}
            onUploadBegin={() => setUploadingImage(true)}
          />
        </section>
        <div className="w-full flex justify-between">
          <DialogClose
            onClick={() => {
              if (new_photo) delete_photo.mutate(new_photo.key);
            }}
          >
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <DialogClose
            onClick={() => {
              query_client.setQueryData<Conversation>(["conversation", params.id], (prev) => {
                if (!prev) return;

                return { ...prev, photo: { ...prev.photo, url: new_photo!.url } };
              });
              setNewPhoto(undefined);
            }}
          >
            <Button>Confirm</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
