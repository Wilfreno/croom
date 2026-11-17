'use client';
import useSetNickname from '@/components/hooks/mutation/useSetNickname.mutation';
import useConversation from '@/components/hooks/queries/useConversation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UserStatus } from '@repo/enums';
import { X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import NicknameRow from './NicknameRow';

export default function NicknamesDialog({ trigger, editUserId }: { trigger: React.ReactNode; editUserId?: string }) {
  const [editingId, setEditingId] = useState('');

  const { session } = useAuth();
  const params = useParams<{ id: string }>();
  const { data: conversation } = useConversation(params.id);
  const setNicknameMutation = useSetNickname(params.id);

  const membersById = useMemo(
    () => new Map(conversation?.members.map((member) => [member.id, member])),
    [conversation?.members],
  );

  const nicknames = conversation?.nicknames ?? [];

  return (
    <Dialog onOpenChange={(isOpen) => setEditingId(isOpen ? (editUserId ?? '') : '')}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="w-[24rem] gap-4 rounded-md"
        onEscapeKeyDown={(e) => {
          if (!editingId) return;
          e.preventDefault();
          setEditingId('');
        }}
      >
        <DialogHeader className="pr-8">
          <DialogTitle>Nicknames</DialogTitle>
          <DialogDescription>Everyone in this chat will see the nicknames you set.</DialogDescription>
        </DialogHeader>
        <DialogClose asChild>
          <Button
            variant="ghost"
            aria-label="Close"
            className="absolute right-3 top-3 aspect-square h-fit w-auto rounded-full p-2"
          >
            <X className="h-4 w-auto" />
          </Button>
        </DialogClose>
        <ul className="flex max-h-[60dvh] min-w-0 flex-col gap-1 overflow-y-auto overflow-x-hidden">
          {nicknames.map(({ user: id, value: nickname }) => {
            const isSelf = id === session.user?.id;
            const member = membersById.get(id);

            return (
              <NicknameRow
                key={id}
                name={member?.displayName ?? (isSelf ? session.user?.displayName : undefined) ?? 'Unknown user'}
                photoUrl={member?.photo?.url ?? (isSelf ? session.user?.photo?.url : undefined)}
                isOnline={!isSelf && member?.status === UserStatus.ONLINE}
                isSelf={isSelf}
                nickname={nickname}
                isEditing={editingId === id}
                isSaving={setNicknameMutation.isPending && setNicknameMutation.variables?.user === id}
                onEdit={() => setEditingId(id)}
                onCancel={() => setEditingId('')}
                onSave={(value) =>
                  setNicknameMutation.mutate({ user: id, value }, { onSuccess: () => setEditingId('') })
                }
              />
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
