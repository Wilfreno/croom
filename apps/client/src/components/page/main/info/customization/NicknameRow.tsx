'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { NICKNAME_MAX_LENGTH } from '@repo/constants';
import { Check, Loader2, PenLine, X } from 'lucide-react';
import { useState } from 'react';
import UserAvatar from '../../UserAvatar';

type NicknameRowProps = {
  name: string;
  photoUrl?: string;
  isOnline: boolean;
  isSelf: boolean;
  nickname: string;
  isEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (value: string) => void;
};

export default function NicknameRow({
  name,
  photoUrl,
  isOnline,
  isSelf,
  nickname,
  isEditing,
  isSaving,
  onEdit,
  onCancel,
  onSave,
}: NicknameRowProps) {
  const avatar = <UserAvatar src={photoUrl} isOnline={isOnline} className="h-10" onlineClassName="h-3" />;
  const youBadge = isSelf && (
    <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide text-muted-foreground">
      You
    </span>
  );

  if (isEditing)
    return (
      <li className="min-w-0 rounded-md border bg-muted/40 p-2">
        <NicknameEditor
          avatar={avatar}
          name={name}
          youBadge={youBadge}
          nickname={nickname}
          isSaving={isSaving}
          onCancel={onCancel}
          onSave={onSave}
        />
      </li>
    );

  return (
    <li className="min-w-0">
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit nickname for ${name}`}
        className="group flex w-full items-center gap-3 rounded-md p-2 text-start transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
      >
        {avatar}
        <div className="grid min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{nickname || name}</span>
            {youBadge}
          </div>
          {nickname ? (
            <span className="truncate text-xs text-muted-foreground">{name}</span>
          ) : (
            <span className="text-xs italic text-muted-foreground">Set nickname</span>
          )}
        </div>
        <PenLine className="h-4 w-auto shrink-0 text-primary" />
      </button>
    </li>
  );
}

function NicknameEditor({
  avatar,
  name,
  youBadge,
  nickname,
  isSaving,
  onCancel,
  onSave,
}: Pick<NicknameRowProps, 'name' | 'nickname' | 'isSaving' | 'onCancel' | 'onSave'> & {
  avatar: React.ReactNode;
  youBadge: React.ReactNode;
}) {
  const [draft, setDraft] = useState(nickname);
  const isUnchanged = draft.trim() === nickname;

  return (
    <form
      autoComplete="off"
      className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!isUnchanged && !isSaving) onSave(draft);
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        {avatar}
        <div className="relative min-w-0 flex-1">
          <Input
            autoFocus
            aria-label={`Nickname for ${name}`}
            placeholder="Set nickname"
            maxLength={NICKNAME_MAX_LENGTH}
            className="pr-9"
            value={draft}
            disabled={isSaving}
            onChange={(e) => setDraft(e.currentTarget.value)}
          />
          {Boolean(draft) && !isSaving && (
            <Button
              type="button"
              variant="ghost"
              aria-label="Clear nickname"
              className="absolute right-1 top-1/2 aspect-square h-fit w-auto -translate-y-1/2 rounded-full p-1"
              onClick={() => setDraft('')}
            >
              <X className="h-4 w-auto" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex min-w-0 items-center justify-between gap-2 pl-[3.25rem]">
        <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">{name}</span>
          {youBadge}
          <span className={cn('shrink-0 tabular-nums', draft.length >= NICKNAME_MAX_LENGTH && 'text-destructive')}>
            {draft.length}/{NICKNAME_MAX_LENGTH}
          </span>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button type="button" variant="ghost" size="sm" disabled={isSaving} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isUnchanged || isSaving}>
            {isSaving ? <Loader2 className="h-4 w-auto animate-spin" /> : <Check className="h-4 w-auto" />}
            <span>{draft.trim() || !nickname ? 'Save' : 'Remove'}</span>
          </Button>
        </div>
      </div>
    </form>
  );
}
