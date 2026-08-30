'use client';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { getConvoOptions } from '@/lib/react-query/prefetch-query-options';
import { POSTRequest, ServerResponse } from '@/lib/server/requests';
import { cn } from '@/lib/utils';
import { Block, Conversation } from '@repo/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';
import { ImageIcon, ImagePlus, SendHorizontal, Smile, ThumbsUp, X } from 'lucide-react';
import NextImage from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { ClientUploadedFileData } from 'uploadthing/types';
import { UploadthingButton } from '../../UploadthingButton';

export default function ComposeMessageInput() {
  const [textInput, setTextInput] = useState('');
  const [photoInput, setPhotoInput] = useState<{ key: string; url: string; width: number; height: number }[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { session } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: selectedUsers } = useQuery<string[][]>({
    queryKey: ['compose', 'selected_users'],
    placeholderData: [],
  });
  const { data: foundConversations, isError } = useQuery<Conversation[]>({
    enabled: !!selectedUsers?.length && !!session.user,
    queryKey: ['conversation', 'members', selectedUsers],
    placeholderData: [],
  });

  const { data: conversation } = useQuery({
    enabled: !!foundConversations && !!foundConversations.length,
    ...getConvoOptions(foundConversations![0]?.id),
  });

  const sendMessage = useMutation<
    void,
    Error,
    {
      conversationId?: string;
      message?: string;
    }
  >({
    mutationFn: async ({ conversationId, message: textMessage }) => {
      try {
        const { status, message } = await POSTRequest('/v1/message', {
          conversation: conversationId,
          text: textMessage ? textMessage : textInput,
          photos: photoInput,
        });

        if (status !== 'CREATED') throw new Error(message);
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
    onSuccess: async (_, { conversationId }) => {
      await queryClient.refetchQueries({
        exact: true,
        queryKey: ['conversation', 'messages', foundConversations?.[0]?.id],
      });
      router.push('/conversation/' + conversationId);
    },
  });

  const createNewConversation = useMutation<
    {
      conversationId?: string;
      message?: string;
    },
    Error,
    string
  >({
    mutationFn: async (textMessage) => {
      try {
        const { data, status, message } = await POSTRequest<Conversation>('/v1/conversation', {
          members: [session.user?.id, ...selectedUsers!.map((user) => user[0])],
        });
        if (status !== 'CREATED') throw new Error(message);
        return { conversationId: data.id, message: textMessage };
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
    onSuccess: (data) => {
      sendMessage.mutate(data);
    },
  });

  const deletePhoto = useMutation<void, Error, { key: string; index: number }>({
    mutationFn: async ({ key }) => {
      try {
        const response = await fetch('/api/photo', {
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

  if (!selectedUsers || !selectedUsers.length) return null;
  if (conversation && conversation.status === 'BLOCKED') {
    if ((conversation.data as Block).blocker) {
      return (
        <div className="bg-primary/80 py-4 text-center font-medium text-accent rounded-b-md">
          <span>You have blocked this user, neither of you can reply on this conversation</span>
        </div>
      );
    } else {
      return (
        <div className="bg-primary/80 py-4 text-center font-medium text-accent rounded-b-md">
          <span>You are unable to reply on this conversation</span>
        </div>
      );
    }
  }

  return (
    <div className="flex items-end p-2 bg-transparent">
      <UploadthingButton
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
          {uploadingImage || !!photoInput.length ? (
            <div className="bg-secondary rounded-t-lg w-full p-4 flex items-center gap-4">
              <UploadthingButton
                endpoint="multipleImage"
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
                {photoInput.map(({ url, key }, index) => (
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
                      onClick={() => deletePhoto.mutate({ key, index })}
                    >
                      <X className="h-4 w-auto" />
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
              ref={textareaRef}
              placeholder="Aa"
              rows={1}
              value={textInput}
              onChange={(e) => {
                setTextInput(e.currentTarget.value);
                e.currentTarget.style.height = 'auto';
                e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
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
        {!!textInput || !!photoInput.length ? (
          <Button
            variant="ghost"
            disabled={(!textInput && !photoInput.length) || sendMessage.isPending}
            type="button"
            className="aspect-square h-fit w-auto p-1 mb-1"
            onClick={() => {
              if (!foundConversations || !foundConversations.length || isError) {
                createNewConversation.mutate('');
              } else {
                sendMessage.mutate({ conversationId: foundConversations[0].id });
              }
            }}
          >
            <SendHorizontal className="h-5 w-auto text-primary" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="aspect-square h-fit w-auto rounded-full p-2"
            onClick={() => {
              if (!foundConversations || !foundConversations.length || isError) {
                createNewConversation.mutate('👍');
              } else {
                sendMessage.mutate({
                  conversationId: foundConversations[0].id,
                  message: '👍',
                });
              }
            }}
          >
            <ThumbsUp className="h-4 w-auto text-primary" />
          </Button>
        )}
      </form>
    </div>
  );
}
