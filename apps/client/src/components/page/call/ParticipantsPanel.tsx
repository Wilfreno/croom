'use client';
import useConversation from '@/components/hooks/queries/useConversation';
import useCallParticipants from '@/components/hooks/useCallParticipants';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLocalMedia } from '@/components/providers/LocalMediaProvider';
import { useCallSidePanel } from '@/components/providers/CallSidePanelProvider';
import { usePinnedParticipants } from '@/components/providers/PinnedParticipantsProvider';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getMemberNickname, peopleLabel } from '@/lib/utils';
import { ParticipantListItem } from '@/types/call.types';
import { MicOff, Pin, PinOff, VideoOff, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import CallSidePanelTransition from './CallSidePanelTransition';
import MemberAvatar from './MemberAvatar';

export default function ParticipantsPanel() {
  const { openPanel } = useCallSidePanel();

  return (
    <CallSidePanelTransition isOpen={openPanel === 'participants'}>
      <ParticipantsPanelContent />
    </CallSidePanelTransition>
  );
}

function ParticipantsPanelContent() {
  const { setOpenPanel } = useCallSidePanel();
  const { session } = useAuth();
  const { isCameraOn, isMicOn } = useLocalMedia();
  const { participants, members } = useCallParticipants();
  const { id: conversationId } = useParams<{ id: string }>();
  const { data: conversation } = useConversation(conversationId);
  const selfId = session.user?.id ?? 'you';

  const items: ParticipantListItem[] = [
    {
      key: 'you',
      userId: selfId,
      displayName: session.user?.displayName ?? 'You',
      nickname: getMemberNickname(conversation, selfId),
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
        nickname: getMemberNickname(conversation, participant.userId),
        photoUrl: member?.photoUrl ?? null,
        isMuted: participant.isAudioPaused,
        isCameraOff: participant.isVideoPaused || !participant.videoTrack,
      };
    }),
  ];

  return (
    <aside
      aria-label="People in the call"
      className="flex h-full shrink-0 flex-col bg-background sm:w-80 sm:border-l"
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
          onClick={() => setOpenPanel(null)}
        >
          <X />
        </Button>
      </header>
      <ScrollArea className="min-h-0 grow">
        <ul className="grid gap-1 p-2">
          {items.map((item) => (
            <li key={item.key} className="flex items-center gap-3 rounded-md p-2 hover:bg-muted">
              <MemberAvatar name={item.displayName} colorKey={item.userId} photoUrl={item.photoUrl} />
              <span className="grid min-w-0 grow">
                <span className="truncate text-sm font-medium">
                  {item.displayName}
                  {item.isYou && <span className="text-muted-foreground"> (You)</span>}
                </span>
                {item.nickname && <span className="truncate text-xs text-muted-foreground">{item.nickname}</span>}
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
