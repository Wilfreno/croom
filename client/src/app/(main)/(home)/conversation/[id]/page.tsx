"use client";

import { UploadthingButton } from "@/components/page/UploadthingButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GETRequest, POSTRequest } from "@/lib/server/requests";
import { Message } from "@/lib/types/server-data-types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { ImageIcon, ImagePlus, UserRound } from "lucide-react";
import { useSession } from "next-auth/react";
import NextImage from "next/image";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import test_image from "../../../../../public/test-image.jpg";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function Page() {
  const [text_input, setTextInput] = useState("");
  const [photo_input, setPhotoInput] = useState<{ url: string; width: number; height: number }[]>([]);
  const [uploading_image, setUploadingImage] = useState(false);

  const textarea_ref = useRef<HTMLTextAreaElement>(null);
  const { data: session } = useSession();
  const router = useRouter();

  const { data: selected_users } = useQuery<string[][]>({
    queryKey: ["compose", "selected_users"],
    placeholderData: [],
  });

  const { data: found_conversation, isError } = useQuery({
    enabled: !!selected_users && selected_users.length === 1,
    queryKey: ["conversation", selected_users?.[0]?.[0]],
    queryFn: async () => {
      try {
        const { data, message, status } = await GETRequest<Message[]>(
          "/v1/conversation?members=" + session?.user.id + "," + selected_users![0][0]
        );

        if (status !== "OK") throw new Error(message);

        return data;
      } catch (error) {
        throw error;
      }
    },
    placeholderData: [],
  });

  const { data: found_messages } = useInfiniteQuery<{ page_param: number; result: Message[] }>({
    enabled: !!found_conversation && !!found_conversation.length,
    queryKey: ["conversation", "messages", found_conversation?.[0]?.id],
    queryFn: async ({ pageParam }) => {
      try {
        const page_param = pageParam as number;
        const {
          data: result,
          status,
          message,
        } = await GETRequest<Message[]>(
          "/v1/conversation/" + found_conversation?.[0].id + "/messages?page=" + page_param
        );

        if (status !== "OK") throw new Error(message);

        return { page_param, result };
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
    initialPageParam: 1,
    getNextPageParam: (last_page) => {
      if (last_page.result.length) return last_page.page_param + 1;
      return undefined;
    },
    placeholderData: { pages: [], pageParams: [] },
  });

  const send_message = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { status, message } = await POSTRequest("/v1/message", {
          conversation: id,
          text: text_input,
          photos: photo_input,
        });

        if (status !== "CREATED") throw new Error(message);

        return id;
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
    onSuccess: (id) => {
      router.push("/conversation/" + id);
    },
  });

  const create_new_conversation = useMutation({
    mutationFn: async () => {
      try {
        const { data, status, message } = await POSTRequest<Conversation>("/v1/conversation", {
          members: [session?.user.id, ...selected_users!],
        });
        if (status !== "CREATED") throw new Error(message);
        return data.id;
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
    onSuccess: (id) => {
      send_message.mutate(id);
    },
  });

  async function onClientUploadComplete(
    response: ClientUploadedFileData<{
      photo_url: string;
    }>[]
  ) {
    for (const res of response) {
      try {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
          const new_image = new Image();
          new_image.onload = () => resolve(new_image);
          new_image.onerror = (err) => reject(err);
          new_image.src = res.url;
        });
        setPhotoInput((prev) => [...prev, { url: res.url, width: image.width, height: image.height }]);
      } catch (error) {
        toast.error((error as Error).message);
        return;
      }
    }
    setUploadingImage(false);
  }

  if (!selected_users || !selected_users.length) return null;
  return (
    <section className="h-full w-full grid grid-rows-[1fr_auto]">
      <div className="h-full w-full">
        {!!found_messages?.pages.length && !isError && (
          <ScrollArea className="h-[80dvh]">
            <div className="flex flex-col p-6">
              {found_messages.pages.map((page) =>
                page.result.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-end gap-4",
                      message.sender.id === session?.user.id ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                  >
                    <Avatar>
                      <AvatarImage src={message.sender.photo?.url} />
                      <AvatarFallback>
                        <UserRound className="h-1/2 w-auto" />
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        "bg-primary max-w-[25vw] rounded-lg text-sm text-white overflow-hidden"
                        // message.type === "PHOTO" && "p-2"
                      )}
                    ></div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </div>
      <div className="flex items-end gap-4 p-4">
        <UploadthingButton
          endpoint="imageUploader"
          className="ut-button:aspect-square ut-button:h-fit ut-button:w-auto ut-button:p-2 ut-button:rounded-full ut-button:bg-background ut-button:hover:bg-secondary ut-allowed-content:hidden ut-button:focus-within:ring-offset-0  ut-button:focus-within:ring-0 ut-button:after:ut-uploading:bg-transparent"
          content={{
            button() {
              return <ImageIcon className="h-5 w-auto text-primary" />;
            },
          }}
          onClientUploadComplete={onClientUploadComplete}
          onUploadError={(e) => {
            toast.error(e.message);
            setUploadingImage(false);
          }}
          onUploadBegin={() => setUploadingImage(true)}
        />
        <form
          className="flex items-end w-full gap-4"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <div className="relative w-full">
            {uploading_image || !!photo_input.length ? (
              <div className="absolute bottom-full left-0 rounded-t-lg bg-secondary w-full p-4 flex items-center gap-4">
                <UploadthingButton
                  endpoint="imageUploader"
                  className="ut-button:aspect-square ut-button:h-fit ut-button:w-auto ut-button:p-2 ut-button:rounded-full ut-button:bg-primary ut-button:focus-within:ring-0 ut-button:focus-within:ring-offset-0 ut-button:hover:bg-primary/80 ut-allowed-content:hidden ut-button:after:ut-uploading:bg-transparent"
                  content={{
                    button() {
                      return <ImagePlus className="h-6 w-auto text-accent" />;
                    },
                  }}
                  onClientUploadComplete={onClientUploadComplete}
                  onUploadError={(e) => {
                    toast.error(e.message);
                    setUploadingImage(false);
                  }}
                  onUploadBegin={() => setUploadingImage(true)}
                />

                <div className="flex items-center gap-2">
                  {photo_input.map(({ url }) => (
                    <NextImage
                      key={url}
                      src={url}
                      alt="image"
                      width={500}
                      height={500}
                      className="aspect-square h-24 w-auto rounded-sm object-cover"
                      priority
                    />
                  ))}
                  {uploading_image && (
                    <div className="aspect-square h-16 w-auto bg-primary animate-pulse rounded-sm"></div>
                  )}
                </div>
              </div>
            ) : null}
            <Textarea
              className={cn(
                "resize-none h-auto max-h-[30dvh] overflow-y-auto bg-secondary min-h-10 focus-visible:ring-0 border-none",
                photo_input.length && "rounded-t-none"
              )}
              ref={textarea_ref}
              placeholder="Message"
              rows={1}
              value={text_input}
              onChange={(e) => {
                setTextInput(e.currentTarget.value);
                e.currentTarget.style.height = "auto";
                e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
              }}
            />
          </div>
          <Button
            disabled={!text_input || !photo_input.length}
            type="button"
            onClick={() => {
              if (!found_conversation || !found_conversation.length || isError) {
                create_new_conversation.mutate();
                return;
              }
              send_message.mutate(found_conversation[0].id);
            }}
          >
            Send
          </Button>
        </form>
      </div>
    </section>
  );
}
