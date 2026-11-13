'use client';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCall } from '@/components/providers/CallProvider';
import { useLocalMedia } from '@/components/providers/LocalMediaProvider';
import { CallParticipant } from '@/types/call.types';
import { CALL_FLOATING_SELF_VIEW_MAX_PEOPLE } from '@repo/constants';
import { CallMember } from '@repo/types';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

/** The call's remote participants, or fake ones while previewing (see usePreviewParticipants). */
export default function useCallParticipants() {
  const call = useCall();
  const preview = usePreviewParticipants();
  return preview ?? { status: call.status, error: call.error, participants: call.participants, members: call.members };
}

/** True once the call is big enough that your camera moves from the floating tile into the grid. */
export function useIsSelfInGrid() {
  const { participants } = useCallParticipants();
  return participants.length + 1 > CALL_FLOATING_SELF_VIEW_MAX_PEOPLE;
}

/** You, in the same shape as a remote participant, so the grid can draw your tile like anyone else's. */
export function useSelfParticipant(): { participant: CallParticipant; member: CallMember } {
  const { session } = useAuth();
  const { isMicOn } = useCall();
  const { localMedia, isCameraOn } = useLocalMedia();
  const userId = session.user?.id ?? 'self';

  return {
    participant: {
      peerId: 'self',
      userId,
      audioTrack: null, // never play your own microphone back
      videoTrack: localMedia.stream?.getVideoTracks()[0] ?? null,
      isAudioPaused: !isMicOn,
      isVideoPaused: !isCameraOn,
    },
    member: { id: userId, displayName: 'You', photoUrl: session.user?.photo?.url ?? null },
  };
}

/**
 * Development only: open the call page with `?preview=N` to fill the call with N fake participants that
 * reuse your own camera, so the layout can be checked without other people in the call.
 * Every third one has its camera off and every fourth one is muted, to show those states too.
 */
function usePreviewParticipants() {
  const searchParams = useSearchParams();
  const { localMedia, isCameraOn } = useLocalMedia();
  const previewCount = Number(searchParams.get('preview'));
  const localVideoTrack = localMedia.stream?.getVideoTracks()[0] ?? null;

  return useMemo(() => {
    if (process.env.NODE_ENV !== 'development' || !Number.isInteger(previewCount) || previewCount < 1) return null;

    const members = new Map<string, CallMember>();
    const participants: CallParticipant[] = [];
    for (let index = 1; index <= previewCount; index++) {
      const userId = `preview-${index}`;
      members.set(userId, { id: userId, displayName: `Preview user ${index}`, photoUrl: null });
      participants.push({
        peerId: userId,
        userId,
        audioTrack: null, // never play your own microphone back
        videoTrack: localVideoTrack,
        isAudioPaused: index % 4 === 0,
        isVideoPaused: !isCameraOn || index % 3 === 0,
      });
    }
    return { status: 'connected' as const, error: null, participants, members };
  }, [previewCount, localVideoTrack, isCameraOn]);
}
