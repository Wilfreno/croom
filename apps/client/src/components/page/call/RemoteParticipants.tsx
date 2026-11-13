'use client';
import useCallParticipants, { useIsSelfInGrid, useSelfParticipant } from '@/components/hooks/useCallParticipants';
import { cn } from '@/lib/utils';
import { CallParticipant } from '@/types/call.types';
import { CALL_MAX_VISIBLE_TILES, CALL_OVERFLOW_AVATAR_COUNT, CALL_TILE_GAP } from '@repo/constants';
import { CallMember } from '@repo/types';
import { MicOff } from 'lucide-react';
import { useEffect, useRef } from 'react';
import ParticipantsSheet, { MemberAvatar } from './ParticipantsSheet';

export default function RemoteParticipants() {
  const { status, error, participants, members } = useCallParticipants();
  const isSelfInGrid = useIsSelfInGrid();
  const self = useSelfParticipant();

  if (status === 'error') return <CallMessage>{error ?? 'Could not join the call'}</CallMessage>;
  if (status === 'connecting') return <CallMessage>Joining the call…</CallMessage>;
  if (participants.length === 0) return <CallMessage>Waiting for others to join…</CallMessage>;

  // In bigger calls your own camera takes the first tile. Past the limit, the last tile stands in for
  // everyone who doesn't get one.
  const selfTileCount = isSelfInGrid ? 1 : 0;
  const remoteTileLimit = CALL_MAX_VISIBLE_TILES - selfTileCount;
  const hasOverflow = participants.length > remoteTileLimit;
  const visibleParticipants = hasOverflow ? participants.slice(0, remoteTileLimit - 1) : participants;
  const hiddenParticipants = hasOverflow ? participants.slice(remoteTileLimit - 1) : [];
  const tileCount = selfTileCount + visibleParticipants.length + (hasOverflow ? 1 : 0);

  // Every tile gets the same share of the space; a short last row (e.g. 3 = 2 + 1) is centered.
  const columns = Math.ceil(Math.sqrt(tileCount));
  const rows = Math.ceil(tileCount / columns);
  const tileSize = {
    width: `calc((100% - ${columns - 1} * ${CALL_TILE_GAP}) / ${columns})`,
    height: `calc((100% - ${rows - 1} * ${CALL_TILE_GAP}) / ${rows})`,
  };

  return (
    <div className="h-full w-full p-2 pb-28">
      <div className="flex h-full w-full flex-wrap content-center justify-center" style={{ gap: CALL_TILE_GAP }}>
        {isSelfInGrid && (
          <div style={tileSize}>
            <ParticipantTile participant={self.participant} member={self.member} isSelf />
          </div>
        )}
        {visibleParticipants.map((participant) => (
          <div key={participant.peerId} style={tileSize}>
            <ParticipantTile participant={participant} member={members.get(participant.userId)} />
          </div>
        ))}
        {hasOverflow && (
          <div style={tileSize}>
            <OverflowTile hiddenParticipants={hiddenParticipants} members={members} />
          </div>
        )}
      </div>

      {/* Everyone is heard, including people without a tile. Kept apart from the tiles so audio doesn't
          restart when someone moves in or out of the visible grid. */}
      {participants.map((participant) => (
        <ParticipantAudio key={participant.peerId} audioTrack={participant.audioTrack} />
      ))}
    </div>
  );
}

function ParticipantAudio({ audioTrack }: { audioTrack: MediaStreamTrack | null }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) audioRef.current.srcObject = audioTrack ? new MediaStream([audioTrack]) : null;
  }, [audioTrack]);

  return <audio ref={audioRef} autoPlay />;
}

function OverflowTile({
  hiddenParticipants,
  members,
}: {
  hiddenParticipants: CallParticipant[];
  members: Map<string, CallMember>;
}) {
  const hiddenCount = hiddenParticipants.length;
  const countLabel = `${hiddenCount} ${hiddenCount === 1 ? 'other' : 'others'}`;

  return (
    <ParticipantsSheet
      title="Also in the call"
      description={`${countLabel} without a tile on screen`}
      items={hiddenParticipants.map((participant) => {
        const member = members.get(participant.userId);
        return {
          key: participant.peerId,
          displayName: member?.displayName ?? 'Unknown',
          photoUrl: member?.photoUrl ?? null,
          isMuted: participant.isAudioPaused,
          isCameraOff: participant.isVideoPaused || !participant.videoTrack,
        };
      })}
      trigger={
        <button
          type="button"
          aria-label={`Show ${countLabel} in the call`}
          className="grid h-full w-full place-content-center justify-items-center gap-3 rounded-lg bg-slate-800 transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex -space-x-4">
            {hiddenParticipants.slice(0, CALL_OVERFLOW_AVATAR_COUNT).map((participant) => (
              <MemberAvatar
                key={participant.peerId}
                photoUrl={members.get(participant.userId)?.photoUrl}
                className="h-14 w-14 border-2 border-slate-800"
              />
            ))}
          </div>
          <p className="text-sm font-medium text-white">{countLabel}</p>
        </button>
      }
    />
  );
}

function ParticipantTile({
  participant,
  member,
  isSelf = false,
}: {
  participant: CallParticipant;
  member?: CallMember;
  isSelf?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const showVideo = Boolean(participant.videoTrack) && !participant.isVideoPaused;

  useEffect(() => {
    if (videoRef.current)
      videoRef.current.srcObject = participant.videoTrack ? new MediaStream([participant.videoTrack]) : null;
  }, [participant.videoTrack]);

  return (
    <div className="relative grid h-full w-full place-items-center overflow-hidden rounded-lg bg-slate-800">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted // sound plays through ParticipantAudio
        className={cn(
          'h-full w-full object-cover',
          isSelf && '-scale-x-100', // mirror only your own view, like a selfie camera
          !showVideo && 'hidden',
        )}
      />
      {!showVideo && (
        <MemberAvatar photoUrl={member?.photoUrl} className="h-20 w-20" />
      )}
      <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-sm text-white">
        {participant.isAudioPaused && <MicOff className="h-4 w-4" aria-label="Muted" />}
        {member?.displayName ?? 'Unknown'}
      </div>
    </div>
  );
}

function CallMessage({ children }: { children: React.ReactNode }) {
  return <div className="grid h-full w-full place-items-center text-muted-foreground">{children}</div>;
}
