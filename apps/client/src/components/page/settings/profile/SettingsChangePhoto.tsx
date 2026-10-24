import { useAuth } from '@/components/providers/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DELETERequest, GETRequest, PATCHRequest } from '@/lib/server/requests';
import { cn } from '@/lib/utils';
import { Photo } from '@repo/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Info, Trash, Upload, UserRound } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ClientUploadedFileData } from 'uploadthing/types';
import { UploadthingButton } from '../../UploadthingButton';

export default function SettingsChangePhoto() {
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();
  const {
    session: { user, update },
  } = useAuth();

  const { data: recentPhotos } = useQuery({
    queryKey: [user, 'photos'],
    queryFn: async () => {
      try {
        const { data, message, status } = await GETRequest<Photo[]>('/v1/user/photos');

        if (status !== 'OK') throw new Error(message);
        return data;
      } catch (error) {
        throw error;
      }
    },
  });

  const changePhoto = useMutation<
    void,
    Error,
    Partial<{
      id: string;
      key: string;
      url: string;
      width: number;
      height: number;
    }>
  >({
    mutationFn: async (newPhoto) => {
      try {
        const { message, status } = await PATCHRequest('/v1/user/photo', {
          photo: newPhoto,
        });
        if (status !== 'OK') toast.error(message);
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (_, newPhoto) => {
      update({ photo: newPhoto as Photo });
      setUploading(false);
    },
  });

  const deletePhoto = useMutation<void, Error, { id: string; index: number }>({
    mutationFn: async ({ id }) => {
      try {
        const { status, message } = await DELETERequest('/v1/photo/', { id });

        if (status !== 'OK') throw new Error(message);
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
    onSuccess: (_, { index }) => {
      queryClient.setQueryData<Photo[]>([user, 'photos'], (prev) => {
        if (!prev) return [];
        return prev.toSpliced(index + 1, 1);
      });
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
        changePhoto.mutate({
          key: res.key,
          url: res.url,
          width: image.width,
          height: image.height,
        });
      } catch (error) {
        toast.error('Oops! something went wrong');
        setUploading(false);
        throw error;
      }
    }
  }

  return (
    <div className="grid gap-4">
      <div className="font-semibold w-full flex items-start justify-between pr-2">
        <span>Profile photo </span>
        <UploadthingButton
          disabled={uploading}
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
          }}
          onUploadBegin={() => setUploading(true)}
        />
      </div>
      <div className="flex items-center justify-center md:justify-start">
        <Avatar className={cn('aspect-square h-36 w-auto shadow-md border', uploading && 'animate-pulse')}>
          <AvatarImage src={user?.photo?.url} />
          <AvatarFallback>
            <UserRound className="h-1/2 w-auto" />
          </AvatarFallback>
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
                    There can only be <strong>5</strong> recent photos available, if you upload a new one when
                    there&apos;s already <strong>5</strong> recent photos the last one will bew deleted.
                  </span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-4 pl-10 min-h-20">
            {recentPhotos?.slice(1).map((photo, index) => (
              <div
                key={photo.id}
                className="aspect-square h-24 w-auto shadow-sm flex items-center justify-center cursor-pointer relative hover:shadow-md hover:border group"
              >
                <Button
                  variant="outline"
                  className={cn(
                    'absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-green-500 hover:text-green-500 hidden group-hover:inline-flex z-50',
                    deletePhoto.isPending && deletePhoto.variables.index === index && 'hidden group-hover:hidden',
                    uploading && 'hidden group-hover:hidden',
                  )}
                  onClick={() => {
                    setUploading(true);
                    changePhoto.mutate(photo);
                  }}
                >
                  change
                </Button>
                <Button
                  variant="outline"
                  className="absolute -top-2 -right-2 aspect-square h-fit w-auto rounded-full p-1 z-50"
                  onClick={() => deletePhoto.mutate({ id: photo.id, index })}
                >
                  <Trash className="h-4 w-auto text-destructive" />
                </Button>
                <Avatar
                  className={cn(
                    'h-full w-full rounded-none z-10',
                    deletePhoto.isPending && deletePhoto.variables.index === index && 'blur-md',
                  )}
                >
                  <AvatarImage src={photo?.url} />
                  <AvatarFallback>
                    <UserRound className="h-1/2 w-auto" />
                  </AvatarFallback>
                </Avatar>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
