"use client";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GETRequest } from "@/lib/server/requests";
import { Message } from "@/lib/types/server-data-types";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import UserAvatar from "../UserAvatar";
import useUserAgent from "@/components/hooks/useUserAgent";
import { cn } from "@/lib/utils";

export default function InfoMedia() {
  const [open, setOpen] = useState(false);
  const [selected_photo, setSelectedPhoto] = useState<{
    message_index: number;
    photo_index: number;
  }>();
  const params = useParams<{ id: string }>();
  const { on_mobile } = useUserAgent();
  const { data: messages } = useQuery({
    enabled: open,
    queryKey: ["conversation", "media", params.id],
    queryFn: async () => {
      try {
        const { data, status, message } = await GETRequest<Message[]>(
          "/v1/conversation/" + params.id + "/media"
        );

        if (status !== "OK") throw new Error(message);
        return data;
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
    placeholderData: [],
  });

  async function downloadImage() {
    try {
      const response = await fetch(
        messages![selected_photo!.message_index].photos[selected_photo!.photo_index].url
      );
      const blob = await response.blob();
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download =
        messages![selected_photo!.message_index].photos[selected_photo!.photo_index].id;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Oops! something went wrong");
      throw error;
    }
  }

  return (
    <Collapsible
      onOpenChange={(is_open) => {
        setOpen(is_open);
      }}
    >
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between font-semibold">
          <span>Media</span>
          {open ? (
            <ChevronDown className="h-4 w-auto" />
          ) : (
            <ChevronRight className="h-4 w-auto" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="p-2">
        {!!messages?.length && (
          <ScrollArea className="h-64">
            <div className="grid grid-cols-4 gap-px">
              {messages?.map((message, message_index) =>
                message.photos.map((photo, photo_index) => (
                  <Dialog key={photo.id}>
                    <DialogTrigger>
                      <div
                        key={photo.id}
                        className="aspect-square w-full h-auto bg-secondary flex items-center hover:scale-105 transition duration-300 ease-in-out"
                        onClick={() => setSelectedPhoto({ message_index, photo_index })}
                      >
                        <Image
                          src={photo.url}
                          width={photo.width}
                          height={photo.height}
                          className="object-cover w-full h-full"
                          alt={photo.id}
                          priority
                        />
                      </div>
                    </DialogTrigger>
                    <DialogContent
                      className={cn("bg-transparent h-[99dvh] p-0", on_mobile && "px-1")}
                    >
                      <DialogHeader className="hidden">
                        <DialogTitle></DialogTitle>
                      </DialogHeader>
                      <DialogClose
                        asChild
                        className={cn(
                          "absolute top-4  group",
                          on_mobile ? "left-4" : "right-8"
                        )}
                      >
                        <Button
                          variant="ghost"
                          className="aspect-square h-fit w-auto rounded-full p-1"
                        >
                          <X className="h-6 w-auto text-accent group-hover:text-black" />
                        </Button>
                      </DialogClose>
                      <div
                        className={cn(
                          "grid h-full w-full grid-rows-[auto_1fr]",
                          on_mobile
                            ? "place-items-center"
                            : "place-items-center gap-8 p-8"
                        )}
                      >
                        {!!selected_photo && (
                          <div
                            className={cn(
                              "py-2 text-accent flex w-full",
                              on_mobile
                                ? "justify-end px-5"
                                : "items-end justify-between px-24"
                            )}
                          >
                            <div
                              className={cn(
                                on_mobile ? "hidden" : "flex items-center gap-2"
                              )}
                            >
                              <UserAvatar
                                src={
                                  messages[selected_photo.message_index].sender.photo?.url
                                }
                                is_online={
                                  messages[selected_photo.message_index].sender.status ===
                                  "ONLINE"
                                }
                              />
                              <div className="">
                                <p className="text-lg font-medium">
                                  {
                                    messages[selected_photo.message_index].sender
                                      .display_name
                                  }
                                </p>
                                <p className="text-xs">
                                  {messages[selected_photo.message_index].sender.username}
                                </p>
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              className="aspect-square h-fit w-auto p-2"
                              onClick={downloadImage}
                            >
                              <Download className="h-6 w-auto" />
                            </Button>
                          </div>
                        )}

                        <div
                          className={cn(
                            "relative",
                            on_mobile
                              ? "grid grid-rows-[auto_1fr] "
                              : "flex items-center gap-8 "
                          )}
                        >
                          {!on_mobile && (
                            <Button
                              variant="secondary"
                              className="aspect-square h-fit w-auto rounded-full"
                              onClick={() =>
                                setSelectedPhoto((prev) => {
                                  if (!prev) return;
                                  let message_index = prev.message_index;
                                  let photo_index = prev.photo_index;

                                  if (photo_index === 0) {
                                    message_index =
                                      (message_index - 1 + messages.length) %
                                      messages.length;
                                    photo_index =
                                      messages![message_index].photos.length - 1;
                                  } else {
                                    photo_index =
                                      (photo_index -
                                        1 +
                                        messages[message_index].photos.length) %
                                      messages[message_index].photos.length;
                                  }

                                  return { message_index, photo_index };
                                })
                              }
                            >
                              <ChevronLeft className="h-4 w-auto" />
                            </Button>
                          )}
                          {!!selected_photo && (
                            <div
                              className={cn(
                                "aspect-video relative",
                                on_mobile
                                  ? "self-center w-full h-auto"
                                  : " h-[80dvh] w-auto"
                              )}
                            >
                              <Image
                                src={
                                  messages[selected_photo.message_index].photos[
                                    selected_photo.photo_index
                                  ].url
                                }
                                alt={
                                  messages[selected_photo.message_index].photos[
                                    selected_photo.photo_index
                                  ].id
                                }
                                width={
                                  messages[selected_photo.message_index].photos[
                                    selected_photo.photo_index
                                  ].width
                                }
                                height={
                                  messages[selected_photo.message_index].photos[
                                    selected_photo.photo_index
                                  ].height
                                }
                                className="object-contain"
                                priority
                              />
                            </div>
                          )}
                          {!on_mobile && (
                            <Button
                              variant="secondary"
                              className="aspect-square h-fit w-auto rounded-full"
                              onClick={() =>
                                setSelectedPhoto((prev) => {
                                  if (!prev) return;
                                  let message_index = prev.message_index;
                                  let photo_index = prev.photo_index;

                                  if (
                                    photo_index + 1 ===
                                    messages![message_index].photos.length
                                  ) {
                                    message_index = (message_index + 1) % messages.length;
                                    photo_index = 0;
                                  } else {
                                    photo_index =
                                      (photo_index + 1) %
                                      messages[message_index].photos.length;
                                  }

                                  return { message_index, photo_index };
                                })
                              }
                            >
                              <ChevronRight className="h-4 w-auto" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
