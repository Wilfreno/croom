'use client';
import useDebounce from '@/components/hooks/useDebounce';
import { useAuth } from '@/components/providers/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GETRequest } from '@/lib/server/requests';
import { cn } from '@/lib/utils';
import { Conversation, User } from '@repo/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronDown, UserRound, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import UserAvatar from '../UserAvatar';

export default function ComposeTo() {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [seeList, setSeeList] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[][]>([]);

  const debouncedValue = useDebounce(inputValue);
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  const userDropdownDivRef = useRef<HTMLDivElement>(null);
  const convoDropdownDivRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: result } = useQuery({
    queryKey: ['search', 'user', debouncedValue],
    queryFn: async () => {
      try {
        if (!debouncedValue) return [];
        const { data, status, message } = await GETRequest<User[]>('/v1/user/search?value=' + debouncedValue);

        if (status !== 'OK') {
          toast.error(message);
          throw new Error(message);
        }

        return data;
      } catch (error) {
        throw error;
      }
    },
    placeholderData: [],
  });

  const { data: foundConversation } = useQuery({
    enabled: !!selectedUsers?.length && !!session.user,
    queryKey: ['conversation', 'members', selectedUsers],
    queryFn: async () => {
      try {
        const { data, message, status } = await GETRequest<Conversation[]>(
          '/v1/conversation?members=' + selectedUsers.map((users) => users[0]).join(','),
        );

        if (status !== 'OK') throw new Error(message);

        return data;
      } catch (error) {
        throw error;
      }
    },
    placeholderData: [],
  });

  useEffect(() => {
    function handleCLick(event: MouseEvent) {
      if (userDropdownDivRef.current && !userDropdownDivRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
      if (convoDropdownDivRef.current && !convoDropdownDivRef.current.contains(event.target as Node)) {
        setSeeList(false);
      }
    }

    document.addEventListener('mousedown', handleCLick);
    return () => {
      document.removeEventListener('mousedown', handleCLick);
    };
  }, []);

  useEffect(() => {
    const cachedSelectedUsers = queryClient.getQueryData<string[][]>(['compose', 'selected_users']);

    if (!!cachedSelectedUsers?.length) setSelectedUsers(cachedSelectedUsers);
  }, []);
  useEffect(() => {
    queryClient.setQueryData(['compose', 'selected_users'], selectedUsers);
  }, [selectedUsers]);

  return (
    <section
      className={cn(
        'w-full border-b flex items-center p-3 relative gap-4 z-50',
        !!selectedUsers?.length && 'shadow-lg',
      )}
    >
      <AnimatePresence>
        {!!foundConversation &&
          foundConversation.length > 1 &&
          foundConversation?.some((convo) => convo.isGroupChat) && (
            <motion.div
              key="found-group-chats"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className="absolute top-full left-0 w-full bg-background border shadow-md py-3 px-5 rounded-b text-sm z-40"
            >
              <strong>You</strong> ,
              {selectedUsers?.map(([id, name], index) => (
                <span key={id}>
                  {index === selectedUsers.length - 1 && 'and '}
                  <strong>{name}</strong>
                  {index !== selectedUsers.length - 1 && ', '}
                </span>
              ))}{' '}
              <span>are already a member of </span>
              <span className="text-primary h-fit w-fit font-medium">
                {foundConversation.length} group chat&#40;s&#41;
              </span>{' '}
              <span>together.</span>{' '}
              <Button
                variant="ghost"
                className="h-fit w-fit p-1 text-primary underline"
                onClick={() => {
                  setOpen(false);
                  setSeeList((prev) => !prev);
                }}
              >
                see list
              </Button>
              <div className={cn('absolute left-0 top-[105%] w-full', seeList ? 'grid' : 'hidden')}>
                <ScrollArea className="h-52">
                  <div className="bg-background gap-1 grid py-2 pr-2">
                    {foundConversation.map((convo) => (
                      <Button
                        key={convo.id}
                        variant="ghost"
                        className="h-fit w-full p-2 justify-start rounded-sm"
                        onClick={() => router.push('/conversation/' + convo.id)}
                      >
                        <Avatar>
                          <AvatarImage src={convo.photo?.url} />
                          <AvatarFallback>
                            <UserRound className="h-1/2 w-auto" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold truncate max-w-[40vw]">{convo.name}</span>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          )}
      </AnimatePresence>
      <div className="flex items-center gap-4">
        <Button variant="ghost" className="aspect-square h-fit w-auto p-1 md:hidden" onClick={() => router.push('/')}>
          <ArrowLeft className="h-4 w-auto" />
        </Button>
        <Label htmlFor="add-member">To: </Label>
      </div>
      {!!selectedUsers && selectedUsers?.length > 5 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="aspect-square h-fit w-auto rounded-full p-2 mx-2">
              <ChevronDown className="h-4 w-auto" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <ScrollArea className="h-[40dvh]">
              <div className="flex flex-col gap-2">
                {selectedUsers!.slice(0, Math.min(selectedUsers!.length - 5, 5)).map((value, index) => (
                  <div
                    key={value[0]}
                    className="h-fit w-full p-2 text-xs flex items-center justify-between gap-2 border rounded-lg"
                  >
                    <span>{value[1]}</span>
                    <Button
                      variant="outline"
                      className="aspect-square h-fit w-auto p-0 rounded-full"
                      onClick={() => setSelectedUsers((prev) => prev.toSpliced(index, 1))}
                    >
                      <X className="h-2" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {!!selectedUsers && !!selectedUsers.length && (
        <div className="flex items-center gap-2">
          {selectedUsers!.slice(-5).map((value, index) => (
            <div
              key={value[0]}
              className="flex items-center gap-2 h-fit w-fit p-2 text-xs whitespace-nowrap border shadow rounded-lg"
            >
              <span className="max-w-32 truncate">{value[1]}</span>
              <Button
                variant="outline"
                className="aspect-square h-fit w-auto p-1 rounded-full"
                onClick={() =>
                  setSelectedUsers((prev) => prev.toSpliced(prev.length < 5 ? index : index + (prev.length - 5), 1))
                }
              >
                <X className="h-2 w-auto" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <div ref={userDropdownDivRef} className="grow">
        <Input
          ref={inputRef}
          id="add-member"
          className="focus-visible:ring-0 shadow-none border-none rounded-none "
          autoComplete="off"
          autoFocus
          onFocus={() => setOpen(true)}
          value={inputValue}
          onChange={(e) => setInputValue(e.currentTarget.value)}
        />
        <div
          className={cn(
            'absolute top-3/4 left-10 w-80 h-[50dvh] bg-background shadow-lg border rounded-sm z-10',
            open ? 'inline-block' : 'hidden',
          )}
        >
          <ScrollArea className="h-full">
            <div className="py-2">
              {result!.map((user) => (
                <Button
                  key={user.id}
                  variant="ghost"
                  className="group rounded-none h-fit w-full justify-start py-2"
                  onClick={() => {
                    if (selectedUsers?.some((selected) => selected[1] === user.displayName)) {
                      toast('Already selected');
                      return;
                    }
                    setSelectedUsers((prev) => [...prev, [user.id, user.displayName]]);
                    setOpen(false);
                    setInputValue('');
                    inputRef.current?.focus();
                  }}
                >
                  <UserAvatar src={user.photo?.url} isOnline={user.status === 'ONLINE'} />
                  <div>
                    <p className="font-semibold">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground">{user.username}</p>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </section>
  );
}
