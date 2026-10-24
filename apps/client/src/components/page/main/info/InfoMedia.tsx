'use client';

import useUserAgent from '@/components/hooks/useUserAgent';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GETRequest } from '@/lib/server/requests';
import { cn } from '@/lib/utils';
import { Message } from '@repo/types';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import UserAvatar from '../UserAvatar';

export default function InfoMedia() {
  const [open, setOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{
    messageIndex: number;
    photoIndex: number;
  }>();
  const params = useParams<{ id: string }>();
  const { onMobile } = useUserAgent();
  const { data: messages } = useQuery({
    enabled: open,
    queryKey: ['conversation', 'media', params.id],
    queryFn: async () => {
      try {
        const { data, status, message } = await GETRequest<Message[]>('/v1/conversation/' + params.id + '/media');

        if (status !== 'OK') throw new Error(message);
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
      const response = await fetch(messages![selectedPhoto!.messageIndex].photos[selectedPhoto!.photoIndex].url);
      const blob = await response.blob();
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = messages![selectedPhoto!.messageIndex].photos[selectedPhoto!.photoIndex].id;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Oops! something went wrong');
      throw error;
    }
  }

  return (
    <Collapsible
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
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
          <ScrollArea className="h-64">
            <div className="grid grid-cols-4 gap-px">
              {messages?.map((message, messageIndex) =>
                message.photos.map((photo, photoIndex) => (
                  <Dialog key={photo.id}>
                    <DialogTrigger>
                      <div
                        key={photo.id}
                        className="aspect-square w-full h-auto bg-secondary flex items-center hover:scale-105 transition duration-300 ease-in-out"
                        onClick={() => setSelectedPhoto({ messageIndex, photoIndex })}
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
                    <DialogContent className={cn('bg-transparent h-[99dvh] p-0', onMobile && 'px-1')}>
                      <DialogHeader className="hidden">
                        <DialogTitle></DialogTitle>
                      </DialogHeader>
                      <DialogClose asChild className={cn('absolute top-4  group', onMobile ? 'left-4' : 'right-8')}>
                        <Button variant="ghost" className="aspect-square h-fit w-auto rounded-full p-1">
                          <X className="h-6 w-auto text-accent group-hover:text-black" />
                        </Button>
                      </DialogClose>
                      <div
                        className={cn(
                          'grid h-full w-full grid-rows-[auto_1fr]',
                          onMobile ? 'place-items-center' : 'place-items-center gap-8 p-8',
                        )}
                      >
                        {!!selectedPhoto && (
                          <div
                            className={cn(
                              'py-2 text-accent flex w-full',
                              onMobile ? 'justify-end px-5' : 'items-end justify-between px-24',
                            )}
                          >
                            <div className={cn(onMobile ? 'hidden' : 'flex items-center gap-2')}>
                              <UserAvatar
                                src={messages[selectedPhoto.messageIndex].sender.photo?.url}
                                isOnline={messages[selectedPhoto.messageIndex].sender.status === 'ONLINE'}
                              />
                              <div className="">
                                <p className="text-lg font-medium">
                                  {messages[selectedPhoto.messageIndex].sender.displayName}
                                </p>
                                <p className="text-xs">{messages[selectedPhoto.messageIndex].sender.username}</p>
                              </div>
                            </div>

                            <Button variant="ghost" className="aspect-square h-fit w-auto p-2" onClick={downloadImage}>
                              <Download className="h-6 w-auto" />
                            </Button>
                          </div>
                        )}

                        <div
                          className={cn(
                            'relative',
                            onMobile ? 'grid grid-rows-[auto_1fr] ' : 'flex items-center gap-8 ',
                          )}
                        >
                          {!onMobile && (
                            <Button
                              variant="secondary"
                              className="aspect-square h-fit w-auto rounded-full"
                              onClick={() =>
                                setSelectedPhoto((prev) => {
                                  if (!prev) return;
                                  let messageIndex = prev.messageIndex;
                                  let photoIndex = prev.photoIndex;

                                  if (photoIndex === 0) {
                                    messageIndex = (messageIndex - 1 + messages.length) % messages.length;
                                    photoIndex = messages![messageIndex].photos.length - 1;
                                  } else {
                                    photoIndex =
                                      (photoIndex - 1 + messages[messageIndex].photos.length) %
                                      messages[messageIndex].photos.length;
                                  }

                                  return { messageIndex, photoIndex };
                                })
                              }
                            >
                              <ChevronLeft className="h-4 w-auto" />
                            </Button>
                          )}
                          {!!selectedPhoto && (
                            <div
                              className={cn(
                                'aspect-video relative',
                                onMobile ? 'self-center w-full h-auto' : ' h-[80dvh] w-auto',
                              )}
                            >
                              <Image
                                src={messages[selectedPhoto.messageIndex].photos[selectedPhoto.photoIndex].url}
                                alt={messages[selectedPhoto.messageIndex].photos[selectedPhoto.photoIndex].id}
                                width={messages[selectedPhoto.messageIndex].photos[selectedPhoto.photoIndex].width}
                                height={
                                  messages[selectedPhoto.messageIndex].photos[selectedPhoto.photoIndex].height
                                }
                                className="object-contain"
                                priority
                              />
                            </div>
                          )}
                          {!onMobile && (
                            <Button
                              variant="secondary"
                              className="aspect-square h-fit w-auto rounded-full"
                              onClick={() =>
                                setSelectedPhoto((prev) => {
                                  if (!prev) return;
                                  let messageIndex = prev.messageIndex;
                                  let photoIndex = prev.photoIndex;

                                  if (photoIndex + 1 === messages![messageIndex].photos.length) {
                                    messageIndex = (messageIndex + 1) % messages.length;
                                    photoIndex = 0;
                                  } else {
                                    photoIndex = (photoIndex + 1) % messages[messageIndex].photos.length;
                                  }

                                  return { messageIndex, photoIndex };
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
                )),
              )}
            </div>
          </ScrollArea>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
