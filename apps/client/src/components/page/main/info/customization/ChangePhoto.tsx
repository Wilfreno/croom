'use client';
import useConversation from '@/components/hooks/queries/useConversation';
import { UploadThingButton } from '@/components/page/UploadthingButton';
import { useAuth } from '@/components/providers/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PATCHRequest } from '@/lib/server/requests';
import { axiosInstance } from '@/lib/axios-instance';
import { cn, getServerErrorMessage, isNotFoundError } from '@/lib/utils';
import { ChangeConversationPhotoResult } from '@/types/conversation-photo.types';
import type { UploadedPhotoResult } from '@/types/upload.types';
import { CONVERSATION_PHOTO_UPLOAD_ENDPOINT, SOMETHING_WENT_WRONG } from '@repo/constants';
import { Conversation, Photo } from '@repo/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, UserRound } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { ClientUploadedFileData } from 'uploadthing/types';

export default function ChangePhoto() {
  const [open, setOpen] = useState(false);
  const [newPhoto, setNewPhoto] = useState<UploadedPhotoResult['photo']>();
  const [uploadingImage, setUploadingImage] = useState(false);

  const { session } = useAuth();
  const params = useParams<{ id: string }>();
  const { data: conversation } = useConversation(params.id);

  const isAdmin = useMemo(() => {
    if (!session || !conversation) return false;

    return conversation.admins.some((user) => user.id === session.user?.id);
  }, [session, conversation]);

  const queryClient = useQueryClient();

  const deletePhoto = useMutation<void, Error, string>({
    async mutationFn(photoId) {
      await axiosInstance.delete(`/upload/${photoId}`);
    },
    onError(error) {
      if (isNotFoundError(error)) return;
      toast.error(getServerErrorMessage(error));
    },
  });

  function cancel() {
    if (newPhoto) deletePhoto.mutate(newPhoto.id);
    setNewPhoto(undefined);
    setOpen(false);
  }

  const setNewPhotoMutation = useMutation({
    mutationFn: async () => {
      try {
        const { status, message, data } = await PATCHRequest<ChangeConversationPhotoResult>(
          '/v1/conversation/' + params.id + '/photo',
          { photoId: newPhoto?.id },
        );

        if (status !== 'OK') throw new Error(message);
        return data.photo;
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
    onSuccess: (savedPhoto) => {
      const photo = savedPhoto as Photo;
      const withNewPhoto = (convo: Conversation): Conversation =>
        convo.id === params.id ? { ...convo, photo } : convo;

      queryClient.setQueryData<Conversation>(['conversation', params.id], (prev) => prev && withNewPhoto(prev));
      queryClient.setQueryData<Conversation[]>([session.user?.id, 'conversations'], (prev) => prev?.map(withNewPhoto));
      queryClient.setQueryData<Conversation[]>(['active', 'conversations', session.user?.id], (prev) =>
        prev?.map(withNewPhoto),
      );
      setNewPhoto(undefined);
      setOpen(false);
    },
  });

  function onClientUploadComplete(uploadedFiles: ClientUploadedFileData<UploadedPhotoResult | null>[]) {
    setUploadingImage(false);

    const uploadedPhoto = uploadedFiles[0]?.serverData?.photo;
    if (!uploadedPhoto) {
      toast.error(SOMETHING_WENT_WRONG);
      return;
    }

    if (newPhoto) deletePhoto.mutate(newPhoto.id);
    setNewPhoto(uploadedPhoto);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) setOpen(true);
        else cancel();
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          disabled={!isAdmin}
          className="w-full justify-start"
        >
          <span className="aspect-square h-fit w-auto p-2 rounded-full bg-secondary text-primary">
            <ImageIcon className="h-4 w-auto" />
          </span>
          <span>Change photo</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="md:w-[30dvw]">
        <DialogHeader className="text-center">
          <DialogTitle>Change Photo</DialogTitle>
        </DialogHeader>
        <section className="grid justify-center my-10 gap-4">
          <Avatar className={cn('aspect-square h-auto w-48', uploadingImage && 'animate-pulse')}>
            <AvatarImage src={newPhoto ? newPhoto.url : conversation?.photo?.url} />
            <AvatarFallback>
              <UserRound className="h-1/2 w-auto" />
            </AvatarFallback>
          </Avatar>
          <UploadThingButton
            disabled={uploadingImage || !session}
            endpoint={CONVERSATION_PHOTO_UPLOAD_ENDPOINT}
            className="ut-button:h-fit ut-button:w-auto ut-button:p-2  ut-button:text-primary  ut-button:font-medium  ut-button:bg-background ut-allowed-content:hidden ut-button:focus-within:ring-offset-0  ut-button:focus-within:ring-0 ut-button:after:ut-uploading:bg-transparent"
            content={{
              button() {
                return uploadingImage ? 'Uploading' : 'Upload';
              },
            }}
            onClientUploadComplete={onClientUploadComplete}
            onUploadError={(e) => {
              toast.error(e.message);
              setUploadingImage(false);
            }}
            onUploadBegin={() => setUploadingImage(true)}
          />
        </section>
        <div className="w-full flex justify-between">
          <Button variant="outline" onClick={cancel}>
            Cancel
          </Button>
          <Button disabled={!newPhoto} onClick={() => setNewPhotoMutation.mutate()}>
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
