'use client';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import InitialsFallback from '@/components/page/main/InitialsFallback';
import { Button } from '@/components/ui/button';
import { IncomingCallPayload } from '@repo/types';
import { Phone, PhoneOff } from 'lucide-react';
import { toast } from 'sonner';

export default function IncomingCallToast({
  call,
  toastId,
  onAccept,
}: {
  call: IncomingCallPayload;
  toastId: string | number;
  onAccept: () => void;
}) {
  return (
    <div className="flex w-full items-center gap-4 rounded-lg border bg-background p-3 shadow-lg">
      <Avatar>
        <AvatarImage src={call.caller.photoUrl ?? undefined} />
        <InitialsFallback name={call.caller.displayName} colorKey={call.caller.id} />
      </Avatar>
      <div className="grid min-w-0 grow">
        <p className="truncate text-sm font-medium">{call.caller.displayName}</p>
        <p className="text-xs text-muted-foreground">is calling you…</p>
      </div>
      <Button
        size="icon"
        variant="destructive"
        className="rounded-full"
        aria-label="Decline call"
        onClick={() => toast.dismiss(toastId)}
      >
        <PhoneOff />
      </Button>
      <Button
        size="icon"
        className="rounded-full bg-green-600 hover:bg-green-700"
        aria-label="Accept call"
        onClick={() => {
          toast.dismiss(toastId);
          onAccept();
        }}
      >
        <Phone />
      </Button>
    </div>
  );
}
