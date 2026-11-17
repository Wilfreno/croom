'use client';
import useCallParticipants from '@/components/hooks/useCallParticipants';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLocalMedia } from '@/components/providers/LocalMediaProvider';
import { useParticipantsPanel } from '@/components/providers/ParticipantsPanelProvider';
import { usePinnedParticipants } from '@/components/providers/PinnedParticipantsProvider';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { peopleLabel } from '@/lib/utils';
import { ParticipantListItem } from '@/types/call.types';
import { MicOff, Pin, PinOff, VideoOff, X } from 'lucide-react';
import MemberAvatar from './MemberAvatar';

export default function ParticipantsPanel() {
  const { isOpen, setIsOpen } = useParticipantsPanel();
  const { session } = useAuth();
  const { isCameraOn, isMicOn } = useLocalMedia();
  const { participants, members } = useCallParticipants();

  if (!isOpen) return null;

  const items: ParticipantListItem[] = [
    {
      key: 'you',
      userId: session.user?.id ?? 'you',
      displayName: session.user?.displayName ?? 'You',
      photoUrl: session.user?.photo?.url ?? null,
      isMuted: !isMicOn,
      isCameraOff: !isCameraOn,
      isYou: true,
    },
    ...participants.map((participant) => {
      const member = members.get(participant.userId);
      return {
        key: participant.peerId,
        peerId: participant.peerId,
        userId: participant.userId,
        displayName: member?.displayName ?? 'Unknown',
        photoUrl: member?.photoUrl ?? null,
        isMuted: participant.isAudioPaused,
        isCameraOff: participant.isVideoPaused || !participant.videoTrack,
      };
    }),
  ];

  return (
    <aside
      aria-label="People in the call"
      className="absolute inset-0 z-10 flex flex-col bg-background sm:static sm:w-80 sm:shrink-0 sm:border-l"
    >
      <header className="flex items-center justify-between gap-2 border-b p-4">
        <div>
          <h2 className="font-semibold">People in the call</h2>
          <p className="text-sm text-muted-foreground">{peopleLabel(items.length)}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="Close people in the call"
          onClick={() => setIsOpen(false)}
        >
          <X />
        </Button>
      </header>
      <ScrollArea className="min-h-0 grow">
        <ul className="grid gap-1 p-2">
          {items.map((item) => (
            <li key={item.key} className="flex items-center gap-3 rounded-md p-2 hover:bg-muted">
              <MemberAvatar name={item.displayName} colorKey={item.userId} photoUrl={item.photoUrl} />
              <span className="grow truncate text-sm font-medium">
                {item.displayName}
                {item.isYou && <span className="text-muted-foreground"> (You)</span>}
              </span>
              {item.isCameraOff && <VideoOff className="h-4 w-4 text-muted-foreground" aria-label="Camera off" />}
              {item.isMuted && <MicOff className="h-4 w-4 text-muted-foreground" aria-label="Muted" />}
              {item.peerId && <PinButton peerId={item.peerId} displayName={item.displayName} />}
            </li>
          ))}
        </ul>
      </ScrollArea>
    </aside>
  );
}

function PinButton({ peerId, displayName }: { peerId: string; displayName: string }) {
  const { isPinned, togglePin } = usePinnedParticipants();
  const pinned = isPinned(peerId);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0 rounded-full"
      aria-label={`${pinned ? 'Unpin' : 'Pin'} ${displayName}`}
      aria-pressed={pinned}
      onClick={() => togglePin(peerId)}
    >
      {pinned ? <PinOff /> : <Pin />}
    </Button>
  );
}
