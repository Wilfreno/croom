'use client';

import useSendMessage from '@/components/hooks/mutation/useSendMessage.mutation';
import useMessageTextarea from '@/components/hooks/useMessageTextarea';
import { UploadThingButton } from '@/components/page/UploadthingButton';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import ConversationBlockedBanner from './ConversationBlockedBanner';
import { axiosInstance } from '@/lib/axios-instance';
import { cn, getServerErrorMessage, isNotFoundError, loadImageSize } from '@/lib/utils';
import type { PhotoInput } from '@/types/message.types';
import type { UploadedPhotoResult } from '@/types/upload.types';
import { MESSAGE_PHOTOS_UPLOAD_ENDPOINT, SOMETHING_WENT_WRONG } from '@repo/constants';
import { ConversationStatus } from '@repo/enums';
import { Conversation } from '@repo/types';
import { useMutation } from '@tanstack/react-query';
import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';
import { Image as ImageIcon, ImagePlus, SendHorizontal, Smile, ThumbsUp, X } from 'lucide-react';
import NextImage from 'next/image';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import type { ClientUploadedFileData } from 'uploadthing/types';

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
  const [deletingPhotoIds, setDeletingPhotoIds] = useState<string[]>([]);

  const params = useParams<{ id: string }>();

  const { sendMessage } = useSendMessage(textInput);
  function removeAttachedPhoto(photoId: string) {
    setPhotoInput((previous) => previous.filter((photo) => photo.id !== photoId));
  }

  const deletePhoto = useMutation<void, Error, string>({
    async mutationFn(photoId) {
      await axiosInstance.delete(`/upload/${photoId}`);
    },
    onMutate(photoId) {
      setDeletingPhotoIds((previous) => [...previous, photoId]);
    },
    onSuccess(_, photoId) {
      removeAttachedPhoto(photoId);
    },
    onError(error, photoId) {
      if (isNotFoundError(error)) {
        removeAttachedPhoto(photoId);
        return;
      }
      toast.error(getServerErrorMessage(error));
    },
    onSettled(_, __, photoId) {
      setDeletingPhotoIds((previous) => previous.filter((deletingId) => deletingId !== photoId));
    },
  });
  const isDeletingPhoto = deletingPhotoIds.length > 0;

  async function onClientUploadComplete(uploadedFiles: ClientUploadedFileData<UploadedPhotoResult | null>[]) {
    try {
      for (const uploadedFile of uploadedFiles) {
        const uploadedPhoto = uploadedFile.serverData?.photo;
        if (!uploadedPhoto) {
          toast.error(SOMETHING_WENT_WRONG);
          continue;
        }

        const { width, height } = await loadImageSize(uploadedPhoto.url);
        setPhotoInput((prev) => [...prev, { id: uploadedPhoto.id, url: uploadedPhoto.url, width, height }]);
      }
    } catch {
      toast.error(SOMETHING_WENT_WRONG);
    } finally {
      setUploadingImage(false);
    }
  }

  function send(text: string) {
    if (isDeletingPhoto) return;
    sendMessage.mutate({ conversationId: params.id, photoInput, text: text || textInput });
    setUploadingImage(false);
    setPhotoInput([]);
    setTextInput('');
  }

  if (conversation?.status === ConversationStatus.BLOCKED) return <ConversationBlockedBanner conversation={conversation} />;

  return (
    <div className="h-full flex items-end p-2 bg-transparent">
      <UploadThingButton
        endpoint={MESSAGE_PHOTOS_UPLOAD_ENDPOINT}
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
                endpoint={MESSAGE_PHOTOS_UPLOAD_ENDPOINT}
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
                {photoInput.map(({ url, id }) => (
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
                      aria-label="remove photo"
                      className="aspect-square h-fit w-auto rounded-full absolute -top-2 -right-2 p-1"
                      disabled={deletingPhotoIds.includes(id)}
                      onClick={() => deletePhoto.mutate(id)}
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
            disabled={(!textInput && !photoInput.length) || uploadingImage || isDeletingPhoto}
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
