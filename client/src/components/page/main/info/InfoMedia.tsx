"use client";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GETRequest } from "@/lib/server/requests";
import { Message } from "@/lib/types/server-data-types";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import UserAvatar from "../UserAvatar";

export default function InfoMedia() {
  const [open, setOpen] = useState(false);
  const [selected_photo, setSelectedPhoto] = useState<{ message_index: number; photo_index: number }>();
  const params = useParams<{ id: string }>();

  const { data: messages } = useQuery({
    enabled: open,
    queryKey: ["conversation", "media", params.id],
    queryFn: async () => {
      try {
        const { data, status, message } = await GETRequest<Message[]>("/v1/conversation/" + params.id + "/media");

        if (status !== "OK") throw new Error(message);
        return data;
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
    placeholderData: [],
  });

  return (
    <Collapsible
      onOpenChange={(is_open) => {
        setOpen(is_open);
      }}
    >
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between font-semibold">
          <span>Media</span>
          {open ? <ChevronDown className="h-4 w-auto" /> : <ChevronRight className="h-4 w-auto" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="p-2">
        {!!messages?.length && (
          <ScrollArea className="h-[40dvh]">
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
                    <DialogContent className="bg-transparent h-[99dvh]">
                      <DialogHeader>
                        <DialogTitle></DialogTitle>
                      </DialogHeader>
                      <DialogClose asChild className="absolute top-4 right-8 group">
                        <Button variant="ghost" className="aspect-square h-fit w-auto rounded-full p-1">
                          <X className="h-6 w-auto text-accent group-hover:text-black" />
                        </Button>
                      </DialogClose>
                      <div className="grid grid-cols-[auto_1fr_auto] place-items-center gap-8">
                        <Button
                          variant="secondary"
                          className="aspect-square h-fit w-auto rounded-full"
                          onClick={() =>
                            setSelectedPhoto((prev) => {
                              if (!prev) return;
                              let message_index = prev.message_index;
                              let photo_index = prev.photo_index;

                              if (photo_index === 0) {
                                message_index = (message_index - 1 + messages.length) % messages.length;
                                photo_index = messages![message_index].photos.length - 1;
                              } else {
                                photo_index =
                                  (photo_index - 1 + messages[message_index].photos.length) %
                                  messages[message_index].photos.length;
                              }

                              return { message_index, photo_index };
                            })
                          }
                        >
                          <ChevronLeft className="h-4 w-auto" />
                        </Button>
                        <div className="aspect-video h-[80dvh] w-auto relative">
                          {!!selected_photo && (
                            <div className="absolute bottom-full left-0 py-2 text-accent flex items-end justify-between w-full ">
                              <div className="flex items-center gap-2">
                                <UserAvatar
                                  src={messages[selected_photo.message_index].sender.photo?.url}
                                  is_online={messages[selected_photo.message_index].sender.status === "ONLINE"}
                                />
                                <div className="">
                                  <p className="text-lg font-medium">
                                    {messages[selected_photo.message_index].sender.display_name}
                                  </p>
                                  <p className="text-xs">{messages[selected_photo.message_index].sender.username}</p>
                                </div>
                              </div>
                              <span className="font-medium px-5">
                                {new Date(messages[selected_photo.message_index].date_created).toLocaleString()}
                              </span>
                            </div>
                          )}
                          {!!selected_photo && (
                            <Image
                              src={messages[selected_photo.message_index].photos[selected_photo.photo_index].url}
                              alt={messages[selected_photo.message_index].photos[selected_photo.photo_index].id}
                              width={messages[selected_photo.message_index].photos[selected_photo.photo_index].width}
                              height={messages[selected_photo.message_index].photos[selected_photo.photo_index].height}
                              priority
                            />
                          )}
                        </div>
                        <Button
                          variant="secondary"
                          className="aspect-square h-fit w-auto rounded-full"
                          onClick={() =>
                            setSelectedPhoto((prev) => {
                              if (!prev) return;
                              let message_index = prev.message_index;
                              let photo_index = prev.photo_index;

                              if (photo_index + 1 === messages![message_index].photos.length) {
                                message_index = (message_index + 1) % messages.length;
                                photo_index = 0;
                              } else {
                                photo_index = (photo_index + 1) % messages[message_index].photos.length;
                              }

                              return { message_index, photo_index };
                            })
                          }
                        >
                          <ChevronRight className="h-4 w-auto" />
                        </Button>
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
