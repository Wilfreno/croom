'use client';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { getConvoOptions } from '@/lib/react-query/prefetch-query-options';
import { PATCHRequest } from '@/lib/server/requests';
import { Conversation } from '@repo/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CaseSensitive, Check, PenLine, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import UserAvatar from '../../UserAvatar';

export default function AddNickname() {
  const [nicknames, setNickname] = useState<Conversation['nicknames']>([]);
  const [selected, setSelected] = useState('');
  const [newNickname, setNewNickname] = useState<{ user: string; value: string }>({
    user: '',
    value: '',
  });

  const { session } = useAuth();
  const params = useParams<{ id: string }>();
  const { data: queryResponse } = useQuery(getConvoOptions(params.id));
  const queryClient = useQueryClient();

  const conversation = useMemo(() => {
    if (!queryResponse || queryResponse.status === 'BLOCKED') return undefined;

    return queryResponse.data as Conversation;
  }, [queryResponse]);

  const setNicknameMutation = useMutation({
    mutationFn: async () => {
      try {
        const { status, message } = await PATCHRequest('/v1/conversation/' + params.id + '/nicknames', {
          nickname: newNickname,
        });

        if (status !== 'OK') throw new Error(message);
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.setQueryData<Conversation>(['conversation', params.id], (prev) => {
        if (!prev) return;

        return {
          ...prev,
          nicknames: prev.nicknames.map((nickname) => (nickname.user === newNickname.user ? newNickname : nickname)),
        };
      });
      queryClient.setQueryData<Conversation[]>([session.user?.id, 'conversations'], (prev) => {
        if (!prev) return;
        return prev.map((conversation) =>
          conversation.id === params.id
            ? {
                ...conversation,
                nicknames: conversation.nicknames.map((nickname) =>
                  nickname.user === newNickname.user ? newNickname : nickname,
                ),
              }
            : conversation,
        );
      });
      setNewNickname({ user: '', value: '' });
      setSelected('');
    },
  });

  useEffect(() => {
    if (!conversation) return;

    setNickname(conversation.nicknames);
  }, [conversation]);

  return (
    <Dialog
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setNewNickname({ user: '', value: '' });
          setSelected('');
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          <span className="aspect-square h-fit w-auto bg-secondary p-2 rounded-full">
            <CaseSensitive className="h-4 w-auto text-primary" />
          </span>
          <span>Add nicknames</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[22rem] rounded-sm gap-10">
        <DialogHeader>
          <DialogTitle>Add Nicknames</DialogTitle>
        </DialogHeader>
        <DialogClose asChild className="absolute top-4 right-2">
          <Button variant="ghost" className="aspect-square h-fit w-auto p-2 rounded-full">
            <X className="h-4 w-auto" />
          </Button>
        </DialogClose>
        <div className="grid space-y-2">
          {nicknames.map(({ user: id, value: nickname }) => {
            return selected === id ? (
              <form
                key={id}
                className="flex items-start gap-2 h-fit w-full p-2"
                autoComplete="off"
                onSubmit={(e) => {
                  e.preventDefault();
                  setNicknameMutation.mutate();
                }}
              >
                <div className="flex items-center gap-2 w-full">
                  <UserAvatar
                    src={
                      id === session.user?.id
                        ? session.user.photo?.url
                        : conversation?.members.find((member) => member.id === id)?.photo?.url
                    }
                    isOnline={
                      id === session.user?.id
                        ? false
                        : conversation?.members.find((member) => member.id === id)?.status === 'ONLINE'
                    }
                  />
                  <div className="grid w-full gap-1">
                    <div className="relative">
                      <Input
                        autoFocus
                        placeholder="Set nickname"
                        className="w-full"
                        onBlur={() => {
                          if (selected === id && !newNickname.value) setSelected('');
                        }}
                        value={newNickname.value}
                        onChange={(e) => setNewNickname({ user: id, value: e.currentTarget.value })}
                      />
                      {!!newNickname.value && (
                        <Button
                          type="button"
                          variant="outline"
                          className="aspect-square h-fit w-auto p-1 rounded-full absolute top-1/2 right-2 -translate-y-1/2"
                          onClick={() => setNewNickname((prev) => ({ ...prev, value: '' }))}
                        >
                          <X className="h-4 w-auto" />
                        </Button>
                      )}
                    </div>
                    <span className="text-xs italic">
                      {conversation?.members.find((member) => member.id === id)?.displayName}
                    </span>
                  </div>
                </div>
                <Button type="submit" variant="secondary" className="aspect-square h-fit w-auto p-2">
                  <Check className="h-4 w-auto text-green-500" />
                </Button>
              </form>
            ) : (
              <Button
                variant="ghost"
                key={id}
                className="justify-between h-fit w-full p-2"
                onClick={() => {
                  setSelected(id);
                  setNewNickname({ user: id, value: nickname });
                }}
              >
                <div className="flex items-center gap-2">
                  <UserAvatar
                    src={
                      id === session.user?.id
                        ? session.user.photo?.url
                        : conversation?.members.find((member) => member.id === id)?.photo?.url
                    }
                    isOnline={
                      id === session.user?.id
                        ? false
                        : conversation?.members.find((member) => member.id === id)?.status === 'ONLINE'
                    }
                  />
                  <div className="grid text-start">
                    {nickname ? (
                      <span className="font-semibold text-base">{nickname}</span>
                    ) : (
                      <span className="italic text-muted-foreground w-fit">Set nickname</span>
                    )}
                    <span className="text-xs italic font-medium">
                      {conversation?.members.find((member) => member.id === id)?.displayName}
                    </span>
                  </div>
                </div>
                <span className="aspect-square h-fit w-auto p-2 bg-primary rounded-full">
                  <PenLine className="h-4 w-auto" />
                </span>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
