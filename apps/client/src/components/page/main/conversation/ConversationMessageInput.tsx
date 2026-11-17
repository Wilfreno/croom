'use client';

import useBlockConversation from '@/components/hooks/mutation/useBlockConversation.mutation';
import useSendMessage from '@/components/hooks/mutation/useSendMessage.mutation';
import useMessageTextarea from '@/components/hooks/useMessageTextarea';
import { useAuth } from '@/components/providers/AuthProvider';
import { UploadThingButton } from '@/components/page/UploadthingButton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { ServerResponse } from '@/lib/server/requests';
import { cn, withBasePath } from '@/lib/utils';
import type { PhotoInput } from '@/types/message.types';
import { ConversationStatus } from '@repo/enums';
import { Conversation } from '@repo/types';
import { useMutation } from '@tanstack/react-query';
import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';
import { Image as ImageIcon, ImagePlus, SendHorizontal, Smile, ThumbsUp, X } from 'lucide-react';
import NextImage from 'next/image';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { ClientUploadedFileData } from 'uploadthing/types';

export default function ConversationMessageInput({ conversation }: { conversation?: Conversation }) {
  const {
    value: textInput,
    setValue: setTextInput,
    textareaProps,
  } = useMessageTextarea({
    onSubmit: () => send(''),
    canSubmit: (value) => Boolean(value.trim()) || Boolean(photoInput.length),
  });
  const [photoInput, setPhotoInput] = useState<PhotoInput[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [confirmUnblockOpen, setConfirmUnblockOpen] = useState(false);

  const params = useParams<{ id: string }>();

  const { session } = useAuth();
  const { sendMessage } = useSendMessage(textInput);
  const { unblockConversation } = useBlockConversation();
  const deletePhoto = useMutation<void, Error, { key: string; index: number }>({
    mutationFn: async ({ key }) => {
      try {
        const response = await fetch(withBasePath('/api/photo'), {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key }),
        });

        const { status, message } = (await response.json()) as ServerResponse;
        if (status !== 'OK') throw new Error(message);
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
      photoUrl: string;
    }>[],
  ) {
    for (const res of response) {
      try {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
          const newImage = new Image();
          newImage.onload = () => resolve(newImage);
          newImage.onerror = (err) => reject(err);
          newImage.src = res.url;
        });
        setPhotoInput((prev) => [...prev, { key: res.key, url: res.url, width: image.width, height: image.height }]);
      } catch (error) {
        toast.error((error as Error).message);
        return;
      }
    }
    setUploadingImage(false);
  }

  function send(text: string) {
    sendMessage.mutate({ conversationId: params.id, photoInput, text: text || textInput });
    setUploadingImage(false);
    setPhotoInput([]);
    setTextInput('');
  }

  if (conversation?.status === ConversationStatus.BLOCKED) {
    if (conversation.blocker === session.user?.id)
      return (
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 bg-primary/80 px-4 py-3 text-center font-medium text-accent rounded-b-md">
          <span>You blocked this person</span>
          <Dialog open={confirmUnblockOpen} onOpenChange={setConfirmUnblockOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm">
                Unblock
              </Button>
            </DialogTrigger>
            <DialogContent className="w-96">
              <DialogHeader>
                <DialogTitle>Unblock this person?</DialogTitle>
                <DialogDescription>You&apos;ll both be able to message each other in this conversation again.</DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  disabled={unblockConversation.isPending}
                  onClick={() =>
                    unblockConversation.mutate(conversation.id, { onSuccess: () => setConfirmUnblockOpen(false) })
                  }
                >
                  Unblock
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      );

    return (
      <div className="bg-primary/80 py-4 text-center font-medium text-accent rounded-b-md">
        <span>You have been blocked</span>
      </div>
    );
  }
  return (
    <div className="h-full flex items-end p-2 bg-transparent">
      <UploadThingButton
        endpoint="multipleImage"
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
          {uploadingImage || Boolean(photoInput.length) ? (
            <div className="bg-secondary rounded-t-lg w-full p-2 md:p-4 flex items-center gap-4">
              <UploadThingButton
                endpoint="multipleImage"
                className="ut-button:aspect-square ut-button:h-fit ut-button:w-auto ut-button:p-2 ut-button:rounded-full ut-button:bg-primary ut-button:focus-within:ring-0 ut-button:focus-within:ring-offset-0 ut-button:hover:bg-primary/80 ut-allowed-content:hidden ut-button:after:ut-uploading:bg-transparent"
                content={{
                  button() {
                    return <ImagePlus className="h-4 md:h-6 w-auto text-accent" />;
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
                {photoInput.map(({ url, key }, index) => (
                  <span key={url} className="relative">
                    <NextImage
                      src={url}
                      alt="image"
                      width={500}
                      height={500}
                      className="aspect-square h-14 md:h-24 w-auto rounded-sm object-cover"
                      priority
                    />
                    <Button
                      className="aspect-square h-fit w-auto rounded-full absolute -top-2 -right-2 p-1"
                      onClick={() => deletePhoto.mutate({ key, index })}
                    >
                      <X className="h-3 md:h-4 w-auto" />
                    </Button>
                  </span>
                ))}
                {uploadingImage && (
                  <div className="aspect-square h-16 w-auto bg-primary animate-pulse rounded-sm"></div>
                )}
              </div>
            </div>
          ) : null}
          <div
            className={cn(
              'flex items-end gap-2 h-fit bg-secondary rounded-lg p-1',
              (photoInput.length || uploadingImage) && 'rounded-t-none',
            )}
          >
            <Textarea
              className={cn(
                'resize-none h-auto max-h-[30dvh] min-h-4 shadow-none  overflow-y-auto  focus-visible:ring-0 border-none placeholder:font-medium scrollbar scrollbar-thumb-gray-300  scrollbar-track-background',
              )}
              placeholder="Aa"
              {...textareaProps}
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
        {Boolean(textInput) || Boolean(photoInput.length) ? (
          <Button
            variant="ghost"
            disabled={(!textInput && !photoInput.length) || uploadingImage}
            type="button"
            className="aspect-square h-fit w-auto p-1 mb-1"
            onClick={() => send('')}
          >
            <SendHorizontal className="h-5 w-auto text-primary" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="aspect-square h-fit w-auto rounded-full p-2"
            onClick={() => {
              send('👍');
            }}
          >
            <ThumbsUp className="h-5 w-auto text-primary" />
          </Button>
        )}
      </form>
    </div>
  );
}
