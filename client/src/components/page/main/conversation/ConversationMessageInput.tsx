"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { POSTRequest, ServerResponse } from "@/lib/server/requests";
import { Message } from "@/lib/types/server-data-types";
import { cn } from "@/lib/utils";
import {
  InfiniteData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Image as ImageIcon,
  ImagePlus,
  SendHorizontal,
  Smile,
  ThumbsUp,
  X,
} from "lucide-react";
import NextImage from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { ClientUploadedFileData } from "uploadthing/types";
import { UploadthingButton } from "@/components/page/UploadthingButton";
import EmojiPicker, { EmojiStyle } from "emoji-picker-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getConvoOptions } from "@/lib/react-query/prefetch-query-options";

export default function ConversationMessageInput() {
  const [text_input, setTextInput] = useState("");
  const [photo_input, setPhotoInput] = useState<
    { key: string; url: string; width: number; height: number }[]
  >([]);
  const [uploading_image, setUploadingImage] = useState(false);

  const textarea_ref = useRef<HTMLTextAreaElement>(null);
  const params = useParams<{ id: string }>();
  const query_client = useQueryClient();

  const { data: conversation } = useQuery(getConvoOptions(params.id));

  const send_message = useMutation<Message, Error, string>({
    mutationFn: async (text) => {
      try {
        const { data, status, message } = await POSTRequest<Message>("/v1/message", {
          conversation: params.id,
          text: text ? text : text_input,
          photos: photo_input,
        });

        if (status !== "CREATED") throw new Error(message);

        return data;
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
    onSuccess: (data) => {
      query_client.setQueryData<
        | InfiniteData<
            {
              page_param: number;
              result: Message[];
            },
            unknown
          >
        | undefined
      >(["conversation", "messages", params.id], (prev) => {
        if (!prev) return;

        return {
          ...prev,
          pages: prev.pages.map(({ page_param, result }, index) => ({
            page_param,
            result: index === prev.pages.length - 1 ? [...result, data] : result,
          })),
        };
      });
      setTextInput("");
      setUploadingImage(false);
      setPhotoInput([]);
    },
  });

  const delete_photo = useMutation<void, Error, { key: string; index: number }>({
    mutationFn: async ({ key }) => {
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
    onSuccess: (_, { index }) => {
      setPhotoInput((prev) => prev.toSpliced(index, 1));
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
        setPhotoInput((prev) => [
          ...prev,
          { key: res.key, url: res.url, width: image.width, height: image.height },
        ]);
      } catch (error) {
        toast.error((error as Error).message);
        return;
      }
    }
    setUploadingImage(false);
  }

  if (conversation && conversation.status === "BLOCKED")
    return (
      <div className="bg-primary/80 py-4 text-center font-medium text-accent rounded-b-md">
        <span>You are unable to reply on this conversation</span>
      </div>
    );
  return (
    <div className="flex items-end p-2 bg-transparent">
      <UploadthingButton
        endpoint="multiple_image"
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
        className="flex items-end w-full gap-2 px-2"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <div className="w-full">
          {uploading_image || !!photo_input.length ? (
            <div className="bg-secondary rounded-t-lg w-full p-4 flex items-center gap-4">
              <UploadthingButton
                endpoint="multiple_image"
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
                {photo_input.map(({ url, key }, index) => (
                  <span key={url} className="relative">
                    <NextImage
                      src={url}
                      alt="image"
                      width={500}
                      height={500}
                      className="aspect-square h-24 w-auto rounded-sm object-cover"
                      priority
                    />
                    <Button
                      className="aspect-square h-fit w-auto rounded-full absolute -top-2 -right-2 p-1"
                      onClick={() => delete_photo.mutate({ key, index })}
                    >
                      <X className="h-4 w-auto" />
                    </Button>
                  </span>
                ))}
                {uploading_image && (
                  <div className="aspect-square h-16 w-auto bg-primary animate-pulse rounded-sm"></div>
                )}
              </div>
            </div>
          ) : null}
          <div
            className={cn(
              "flex items-end gap-2 h-fit bg-secondary rounded-lg p-1",
              (photo_input.length || uploading_image) && "rounded-t-none"
            )}
          >
            <Textarea
              className={cn(
                "resize-none h-auto max-h-[30dvh] min-h-4 shadow-none  overflow-y-auto  focus-visible:ring-0 border-none placeholder:font-medium scrollbar scrollbar-thumb-gray-300  scrollbar-track-background"

                // (!!text_input || !!photo_input.length) && "rounded-lg"
              )}
              ref={textarea_ref}
              placeholder="Aa"
              rows={1}
              value={text_input}
              onChange={(e) => {
                setTextInput(e.currentTarget.value);
                e.currentTarget.style.height = "auto";
                e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
              }}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="my-1">
                <Button variant="ghost" className="aspect-square h-fit w-auto p-0">
                  <Smile className="h-6 w-auto text-background fill-primary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="p-0">
                <EmojiPicker
                  className="border-none"
                  emojiStyle={EmojiStyle.NATIVE}
                  onEmojiClick={(emoji) => {
                    setTextInput((prev) => prev + emoji.emoji);
                  }}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {!!text_input || !!photo_input.length ? (
          <Button
            variant="ghost"
            disabled={
              (!text_input && !photo_input.length) ||
              send_message.isPending ||
              uploading_image
            }
            type="button"
            className="aspect-square h-fit w-auto p-1 mb-1"
            onClick={() => send_message.mutate("")}
          >
            <SendHorizontal className="h-5 w-auto text-primary" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="aspect-square h-fit w-auto rounded-full p-2"
            onClick={() => {
              send_message.mutate("👍");
            }}
          >
            <ThumbsUp className="h-5 w-auto text-primary" />
          </Button>
        )}
      </form>
    </div>
  );
}
