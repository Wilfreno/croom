'use client';
import useCallParticipants from '@/components/hooks/useCallParticipants';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCall } from '@/components/providers/CallProvider';
import { useLocalMedia } from '@/components/providers/LocalMediaProvider';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { ParticipantListItem } from '@/types/call.types';
import { peopleLabel } from '@/lib/utils';
import ParticipantsSheet from './ParticipantsSheet';

/** Controls button that opens a list of everyone in the call, you first. */
export default function ParticipantsButton() {
  const { session } = useAuth();
  const { isMicOn } = useCall();
  const { isCameraOn } = useLocalMedia();
  const { participants, members } = useCallParticipants();

  const items: ParticipantListItem[] = [
    {
      key: 'you',
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
        displayName: member?.displayName ?? 'Unknown',
        photoUrl: member?.photoUrl ?? null,
        isMuted: participant.isAudioPaused,
        isCameraOff: participant.isVideoPaused || !participant.videoTrack,
      };
    }),
  ];

  return (
    <ParticipantsSheet
      title="People in the call"
      description={peopleLabel(items.length)}
      items={items}
      trigger={
        <Button variant="outline" className="relative rounded-full" aria-label={`Show ${peopleLabel(items.length)}`}>
          <Users />
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-medium text-primary-foreground">
            {items.length}
          </span>
        </Button>
      }
    />
  );
}
