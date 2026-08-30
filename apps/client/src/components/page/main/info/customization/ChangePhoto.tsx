'use client';
import { UploadthingButton } from '@/components/page/UploadthingButton';
import { useAuth } from '@/components/providers/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getConvoOptions } from '@/lib/react-query/prefetch-query-options';
import { PATCHRequest, ServerResponse } from '@/lib/server/requests';
import { cn } from '@/lib/utils';
import { Conversation } from '@repo/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, UserRound } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { ClientUploadedFileData } from 'uploadthing/types';

export default function ChangePhoto() {
  const [open, setOpen] = useState(false);
  const [newPhoto, setNewPhoto] = useState<{ key: string; url: string }>();
  const [uploadingImage, setUploadingImage] = useState(false);

  const { session } = useAuth();
  const params = useParams<{ id: string }>();
  const { data: queryResponse } = useQuery(getConvoOptions(params.id));
  const queryClient = useQueryClient();

  const deletePhoto = useMutation({
    mutationFn: async () => {
      try {
        if (!newPhoto) return;
        const response = await fetch('/api/photo', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key: newPhoto?.key }),
        });

        const { status, message } = (await response.json()) as ServerResponse;
        if (status !== 'OK') throw new Error(message);
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
    onSuccess: () => {
      setNewPhoto(undefined);
      setOpen(false);
    },
  });

  const setNewPhotoMutation = useMutation({
    mutationFn: async () => {
      try {
        const { status, message } = await PATCHRequest('/v1/conversation/' + params.id + '/photo', {
          photo: { url: newPhoto?.url },
        });

        if (status !== 'OK') throw new Error(message);
      } catch (error) {
        toast.error((error as Error).message);
      }
    },
    onSuccess: () => {
      queryClient.setQueryData<Conversation>(['conversation', params.id], (prev) => {
        if (!prev) return;

        return { ...prev, photo: { ...prev.photo, url: newPhoto!.url } };
      });
      queryClient.setQueryData<Conversation[]>([session.user?.id, 'conversations'], (prev) => {
        if (!prev) return [];

        return prev.map((convo) =>
          convo.id === params.id ? { ...convo, photo: { ...convo.photo, url: newPhoto!.url } } : convo,
        );
      });
      queryClient.setQueryData<Conversation[]>([session.user?.id, 'active', 'conversations'], (prev) => {
        if (!prev) return [];
        return prev.map((convo) =>
          convo.id === params.id ? { ...convo, photo: { ...convo.photo, url: newPhoto!.url } } : convo,
        );
      });
      setNewPhoto(undefined);
      setOpen(false);
    },
  });

  async function onClientUploadComplete(
    response: ClientUploadedFileData<{
      photoUrl: string;
    }>[],
  ) {
    if (newPhoto) {
      deletePhoto.mutate();
    }
    for (const res of response) {
      try {
        setNewPhoto({ key: res.key, url: res.url });
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
      <DialogContent className="w-[30dvw]">
        <DialogHeader className="text-center">
          <DialogTitle>Change Photo</DialogTitle>
        </DialogHeader>
        <section className="grid justify-center my-10 gap-4">
          <Avatar className={cn('aspect-square h-auto w-48', uploadingImage && 'animate-pulse')}>
            <AvatarImage src={newPhoto ? newPhoto.url : (queryResponse?.data as Conversation).photo?.url} />
            <AvatarFallback>
              <UserRound className="h-1/2 w-auto" />
            </AvatarFallback>
          </Avatar>
          <UploadthingButton
            disabled={uploadingImage || !session}
            endpoint="singleImage"
            className="ut-button:h-fit ut-button:w-auto ut-button:p-2  ut-button:text-primary  ut-button:font-medium  ut-button:bg-background ut-allowed-content:hidden ut-button:focus-within:ring-offset-0  ut-button:focus-within:ring-0 ut-button:after:ut-uploading:bg-transparent"
            content={{
              button() {
                return uploadingImage ? 'Uploading' : 'Upload';
              },
            }}
            onClientUploadComplete={onClientUploadComplete}
            onUploadError={(e) => {
              toast.error(e.message);
              deletePhoto.mutate();
            }}
            onUploadBegin={() => setUploadingImage(true)}
          />
        </section>
        <div className="w-full flex justify-between">
          <Button variant="outline" onClick={() => deletePhoto.mutate()}>
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
