import { useAuth } from '@/components/providers/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import InitialsFallback from '@/components/page/main/InitialsFallback';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { axiosInstance } from '@/lib/axios-instance';
import { cn, getServerErrorMessage } from '@/lib/utils';
import type { ChangeProfilePhotoResult, ChangeProfilePhotoVariables, ProfilePhoto } from '@/types/user-settings.types';
import { MAX_RECENT_PROFILE_PHOTOS, PROFILE_PHOTO_CHANGED, SOMETHING_WENT_WRONG } from '@repo/constants';
import type { Photo, ServerResponse } from '@repo/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Info, Trash, Upload, UserRound } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ClientUploadedFileData } from 'uploadthing/types';
import { UploadThingButton } from '../../UploadthingButton';

export default function SettingsChangePhoto() {
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();
  const {
    session: { user, update },
  } = useAuth();

  const photosQueryKey = [user?.id, 'photos'];
  const currentPhotoId = user?.photo?.id;

  const { data: profilePhotos } = useQuery({
    queryKey: photosQueryKey,
    async queryFn() {
      const { data: response } = await axiosInstance.get<ServerResponse<ProfilePhoto[]>>('/user/photos');
      return response.data;
    },
  });

  const recentPhotos = profilePhotos?.filter((photo) => photo.id !== currentPhotoId) ?? [];

  const changePhoto = useMutation<ChangeProfilePhotoResult, Error, ChangeProfilePhotoVariables>({
    async mutationFn(variables) {
      if ('uploaded' in variables) {
        const { data: response } = await axiosInstance.patch<ServerResponse<ChangeProfilePhotoResult>>(
          '/user/photo',
          { photo: variables.uploaded },
        );
        return response.data;
      }

      const { data: response } = await axiosInstance.patch<ServerResponse<ChangeProfilePhotoResult>>(
        `/user/photos/${variables.recentPhotoId}`,
      );
      return response.data;
    },
    async onSuccess({ photo }) {
      await update({ photo: photo as Photo });
      toast.success(PROFILE_PHOTO_CHANGED);
      await queryClient.invalidateQueries({ queryKey: photosQueryKey });
    },
    onError(error) {
      toast.error(getServerErrorMessage(error));
    },
    onSettled() {
      setUploading(false);
    },
  });

  const deletePhoto = useMutation<void, Error, string>({
    async mutationFn(photoId) {
      await axiosInstance.delete(`/user/photos/${photoId}`);
    },
    onSuccess(_, photoId) {
      queryClient.setQueryData<ProfilePhoto[]>(photosQueryKey, (previous) =>
        previous?.filter((photo) => photo.id !== photoId),
      );
    },
    onError(error) {
      toast.error(getServerErrorMessage(error));
    },
  });

  async function onClientUploadComplete(response: ClientUploadedFileData<{ photoUrl: string }>[]) {
    for (const uploadedFile of response) {
      try {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
          const newImage = new Image();

          newImage.onload = () => resolve(newImage);
          newImage.onerror = (err) => reject(err);
          newImage.src = uploadedFile.url;
        });
        changePhoto.mutate({
          uploaded: {
            key: uploadedFile.key,
            url: uploadedFile.url,
            width: image.width,
            height: image.height,
          },
        });
      } catch {
        toast.error(SOMETHING_WENT_WRONG);
        setUploading(false);
      }
    }
  }

  const isBusy = uploading || changePhoto.isPending;

  return (
    <div className="grid gap-4">
      <div className="font-semibold w-full flex items-start justify-between pr-2">
        <span>Profile photo </span>
        <UploadThingButton
          disabled={isBusy}
          endpoint="singleImage"
          className="ut-button:h-fit ut-button:w-fit ut-button:p-2 ut-button:gap-2 ut-uploading:ut-button:bg-primary/50 ut-button:bg-primary ut-button:focus-within:ring-0 ut-button:focus-within:ring-offset-0 ut-button:hover:bg-primary/80 ut-allowed-content:hidden ut-button:after:ut-uploading:bg-transparent"
          content={{
            button() {
              return (
                <>
                  <Upload className="h-4 w-auto" />
                  <span className="text-sm font-medium">Upload</span>
                </>
              );
            },
          }}
          onClientUploadComplete={onClientUploadComplete}
          onUploadError={(e) => {
            toast.error(e.message);
            setUploading(false);
          }}
          onUploadBegin={() => setUploading(true)}
        />
      </div>
      <div className="flex items-center justify-center md:justify-start">
        <Avatar className={cn('aspect-square h-36 w-auto shadow-md border', isBusy && 'animate-pulse')}>
          <AvatarImage src={user?.photo?.url} />
          <InitialsFallback name={user?.displayName} colorKey={user?.id} />
        </Avatar>
        <div className="hidden md:grid gap-2 p-2 pl-10 ">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold self-start">Recent photos</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-auto" />
                </TooltipTrigger>
                <TooltipContent align="end" side="right">
                  <span>
                    Only your <strong>{MAX_RECENT_PROFILE_PHOTOS}</strong> latest photos are kept. Uploading another one
                    deletes the oldest.
                  </span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-4 pl-10 min-h-20">
            {recentPhotos.map((photo) => {
              const isBeingDeleted = deletePhoto.isPending && deletePhoto.variables === photo.id;

              return (
                <div
                  key={photo.id}
                  className="aspect-square h-24 w-auto shadow-sm flex items-center justify-center cursor-pointer relative hover:shadow-md hover:border group"
                >
                  <Button
                    variant="outline"
                    className={cn(
                      'absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-green-500 hover:text-green-500 hidden group-hover:inline-flex z-50',
                      (isBeingDeleted || isBusy) && 'hidden group-hover:hidden',
                    )}
                    disabled={isBusy}
                    onClick={() => changePhoto.mutate({ recentPhotoId: photo.id })}
                  >
                    change
                  </Button>
                  <Button
                    variant="outline"
                    aria-label="delete photo"
                    className="absolute -top-2 -right-2 aspect-square h-fit w-auto rounded-full p-1 z-50"
                    disabled={isBeingDeleted || isBusy}
                    onClick={() => deletePhoto.mutate(photo.id)}
                  >
                    <Trash className="h-4 w-auto text-destructive" />
                  </Button>
                  <Avatar className={cn('h-full w-full rounded-none z-10', isBeingDeleted && 'blur-md')}>
                    <AvatarImage src={photo.url} />
                    <AvatarFallback>
                      <UserRound className="h-1/2 w-auto" />
                    </AvatarFallback>
                  </Avatar>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
