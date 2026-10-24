'use client';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { getConvoOptions } from '@/lib/react-query/prefetch-query-options';
import { PATCHRequest } from '@/lib/server/requests';
import { cn } from '@/lib/utils';
import { Conversation } from '@repo/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Pen, PenLine, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function ChangeName() {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);

  const params = useParams<{ id: string }>();
  const { session } = useAuth();
  const { data: queryResponse } = useQuery(getConvoOptions(params.id));
  const queryClient = useQueryClient();

  const inputRef = useRef<HTMLInputElement>(null);

  const isAdmin = useMemo(() => {
    if (!session || !queryResponse) return false;

    return (queryResponse.data as Conversation).admins.some((user) => user.id === session.user?.id);
  }, [session, queryResponse]);

  const changeName = useMutation({
    mutationFn: async () => {
      try {
        const { status, message } = await PATCHRequest('/v1/query_response/' + params.id + '/name', {
          name: value,
        });

        if (status !== 'OK') throw new Error(message);
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
    onSuccess: async () => {
      queryClient.setQueryData<Conversation>(['query_response', params.id], (prev) => ({
        ...prev!,
        name: value,
      }));
      queryClient.setQueryData<Conversation[]>([session.user?.id, 'conversations'], (prev) => {
        if (!prev) return [];

        return prev.map((convo) => (convo.id === params.id ? { ...convo, name: value } : convo));
      });

      queryClient.setQueryData<Conversation[]>([session.user?.id, 'active', 'conversations'], (prev) => {
        if (!prev) return [];
        return prev.map((convo) => (convo.id === params.id ? { ...convo, name: value } : convo));
      });
      setOpen(false);
      toast.success('name changed');
    },
  });

  return (
    <Dialog onOpenChange={() => setValue((queryResponse?.data as Conversation).name)}>
      <DialogTrigger asChild>
        <Button variant="ghost" disabled={!isAdmin} className="w-full justify-start">
          <span className="aspect-square h-fit w-auto p-2 rounded-full bg-secondary">
            <PenLine className="h-4 w-auto text-primary" />
          </span>
          <span>Change chat name</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[35dvw]">
        <DialogHeader>
          <DialogTitle>Change name</DialogTitle>
        </DialogHeader>
        <DialogClose asChild className="absolute top-2 right-2">
          <Button variant="ghost" className="aspect-auto h-fit w-auto p-2 rounded-full">
            <X className="h-4 w-auto" />
          </Button>
        </DialogClose>
        <form
          className="flex gap-2 items-center p-2"
          onSubmit={(e) => {
            e.preventDefault();
            changeName.mutate();
          }}
        >
          {open ? (
            <>
              <div className="relative w-full">
                <Input
                  ref={inputRef}
                  placeholder="Change name"
                  autoComplete="off"
                  autoFocus
                  value={value}
                  onChange={(e) => setValue(e.currentTarget.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'aspect-square h-fit w-auto p-1 rounded-full absolute top-1/2 right-2 -translate-y-1/2',
                    !value && 'hidden',
                  )}
                  onClick={() => {
                    setValue('');
                    inputRef.current?.focus();
                  }}
                >
                  <X className="h-3 w-auto" />
                </Button>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="aspect-square h-fit w-auto p-2 rounded-full"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-auto text-destructive" />
              </Button>
              <Button
                type="submit"
                variant="secondary"
                className="aspect-square h-fit w-auto p-2 rounded-full"
                disabled={changeName.isPending}
              >
                <Check className="h-4 w-auto text-green-500" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-between"
              type="button"
              onClick={() => {
                setValue((queryResponse?.data as Conversation).name);
                setOpen(true);
              }}
            >
              <span>{(queryResponse?.data as Conversation).name}</span>
              <span className="aspect-square h-fit w-auto p-2 bg-background shadow-sm border rounded-full text-primary">
                <Pen className="h-4 w-auto" />
              </span>
            </Button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
