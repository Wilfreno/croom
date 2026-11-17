'use client';
import useCallParticipants, { useIsSelfInGrid, useSelfParticipant } from '@/components/hooks/useCallParticipants';
import { useAuth } from '@/components/providers/AuthProvider';
import { useParticipantsPanel } from '@/components/providers/ParticipantsPanelProvider';
import { usePinnedParticipants } from '@/components/providers/PinnedParticipantsProvider';
import { cn, getTileSize, othersLabel } from '@/lib/utils';
import { CallParticipant } from '@/types/call.types';
import {
  CALL_MAX_VISIBLE_TILES,
  CALL_OVERFLOW_AVATAR_COUNT,
  CALL_PINNED_SIDE_MAX_TILES,
  CALL_TILE_GAP,
} from '@repo/constants';
import { CallMember } from '@repo/types';
import { MicOff, Pin } from 'lucide-react';
import { useEffect, useRef } from 'react';
import MemberAvatar from './MemberAvatar';

export default function RemoteParticipants() {
  const { status, error, participants, members } = useCallParticipants();
  const isSelfInGrid = useIsSelfInGrid();
  const self = useSelfParticipant();
  const { session } = useAuth();
  const { pinnedPeerId } = usePinnedParticipants();

  if (status === 'error') return <CallMessage>{error ?? 'Could not join the call'}</CallMessage>;
  if (status === 'connecting') return <CallMessage>Joining the call…</CallMessage>;
  if (participants.length === 0) return <CallMessage>Waiting for others to join…</CallMessage>;

  const selfMember = { ...self.member, displayName: session.user?.displayName ?? self.member.displayName };
  const pinnedParticipant = participants.find((participant) => participant.peerId === pinnedPeerId);

  return (
    <div className="flex h-full w-full flex-col gap-2 p-2 pb-28">
      {pinnedParticipant ? (
        <PinnedLayout
          pinnedParticipant={pinnedParticipant}
          otherParticipants={participants.filter((participant) => participant !== pinnedParticipant)}
          members={members}
          self={isSelfInGrid ? { participant: self.participant, member: selfMember } : null}
        />
      ) : (
        <GridLayout
          participants={participants}
          members={members}
          self={isSelfInGrid ? { participant: self.participant, member: selfMember } : null}
        />
      )}

      {/* Everyone is heard, including people without a tile. Kept apart from the tiles so audio doesn't
          restart when someone moves in or out of the visible grid. */}
      {participants.map((participant) => (
        <ParticipantAudio key={participant.peerId} audioTrack={participant.audioTrack} />
      ))}
    </div>
  );
}

function GridLayout({
  participants,
  members,
  self,
}: {
  participants: CallParticipant[];
  members: Map<string, CallMember>;
  self: { participant: CallParticipant; member: CallMember } | null;
}) {
  // In bigger calls your own camera takes the first tile. Past the limit, the last tile stands in for
  // everyone who doesn't get one.
  const selfTileCount = self ? 1 : 0;
  const remoteTileLimit = CALL_MAX_VISIBLE_TILES - selfTileCount;
  const hasOverflow = participants.length > remoteTileLimit;
  const visibleParticipants = hasOverflow ? participants.slice(0, remoteTileLimit - 1) : participants;
  const hiddenParticipants = hasOverflow ? participants.slice(remoteTileLimit - 1) : [];
  const tileCount = selfTileCount + visibleParticipants.length + (hasOverflow ? 1 : 0);
  const tileSize = getTileSize(tileCount);

  return (
    <div className="flex h-full w-full flex-wrap content-center justify-center" style={{ gap: CALL_TILE_GAP }}>
      {self && (
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
  );
}

function PinnedLayout({
  pinnedParticipant,
  otherParticipants,
  members,
  self,
}: {
  pinnedParticipant: CallParticipant;
  otherParticipants: CallParticipant[];
  members: Map<string, CallMember>;
  self: { participant: CallParticipant; member: CallMember } | null;
}) {
  const sideTiles = [
    ...(self ? [{ ...self, isSelf: true }] : []),
    ...otherParticipants.map((participant) => ({
      participant,
      member: members.get(participant.userId),
      isSelf: false,
    })),
  ];
  const hasSideOverflow = sideTiles.length > CALL_PINNED_SIDE_MAX_TILES;
  const visibleSideTiles = hasSideOverflow ? sideTiles.slice(0, CALL_PINNED_SIDE_MAX_TILES - 1) : sideTiles;
  const hiddenSideCount = sideTiles.length - visibleSideTiles.length;
  const hasStrip = sideTiles.length > 0;

  return (
    <div className="flex min-h-0 w-full grow flex-col sm:flex-row" style={{ gap: CALL_TILE_GAP }}>
      <div className="min-h-0 min-w-0 grow">
        <ParticipantTile
          participant={pinnedParticipant}
          member={members.get(pinnedParticipant.userId)}
          isPinned
        />
      </div>
      {hasStrip && (
        <div className="flex h-24 shrink-0 justify-center sm:h-auto sm:w-40 sm:flex-col lg:w-56">
          <ul
            aria-label="Other people in the call"
            className="flex max-w-full overflow-x-auto sm:max-h-full sm:flex-col sm:overflow-x-hidden sm:overflow-y-auto"
            style={{ gap: CALL_TILE_GAP }}
          >
            {visibleSideTiles.map((tile) => (
              <li key={tile.participant.peerId} className="aspect-video h-full shrink-0 sm:h-auto sm:w-full">
                <ParticipantTile participant={tile.participant} member={tile.member} isSelf={tile.isSelf} isCompact />
              </li>
            ))}
            {hasSideOverflow && (
              <li className="aspect-video h-full shrink-0 sm:h-auto sm:w-full">
                <RemainingCountTile count={hiddenSideCount} />
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function RemainingCountTile({ count }: { count: number }) {
  const { setIsOpen } = useParticipantsPanel();

  return (
    <button
      type="button"
      aria-label={`Show ${othersLabel(count)} in the call`}
      onClick={() => setIsOpen(true)}
      className="grid h-full w-full place-items-center rounded-lg bg-slate-800 text-lg font-semibold text-white transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      +{count}
    </button>
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
  const { setIsOpen } = useParticipantsPanel();
  const hiddenCount = hiddenParticipants.length;
  const countLabel = othersLabel(hiddenCount);

  return (
    <button
      type="button"
      aria-label={`Show ${countLabel} in the call`}
      onClick={() => setIsOpen(true)}
      className="grid h-full w-full place-content-center justify-items-center gap-3 rounded-lg bg-slate-800 transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex -space-x-4">
        {hiddenParticipants.slice(0, CALL_OVERFLOW_AVATAR_COUNT).map((participant) => (
          <MemberAvatar
            key={participant.peerId}
            name={members.get(participant.userId)?.displayName}
            colorKey={participant.userId}
            photoUrl={members.get(participant.userId)?.photoUrl}
            className="h-14 w-14 border-2 border-slate-800"
          />
        ))}
      </div>
      <p className="text-sm font-medium text-white">{countLabel}</p>
    </button>
  );
}

function ParticipantTile({
  participant,
  member,
  isSelf = false,
  isPinned = false,
  isCompact = false,
}: {
  participant: CallParticipant;
  member?: CallMember;
  isSelf?: boolean;
  isPinned?: boolean;
  isCompact?: boolean;
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
        <MemberAvatar
          name={member?.displayName}
          colorKey={participant.userId}
          photoUrl={member?.photoUrl}
          className={isCompact ? 'h-10 w-10' : 'h-20 w-20'}
        />
      )}
      <div
        className={cn(
          'absolute flex max-w-[calc(100%-1rem)] items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-white',
          isCompact ? 'bottom-1 left-1 text-xs' : 'bottom-2 left-2 text-sm',
        )}
      >
        {isPinned && <Pin className="h-4 w-4 shrink-0" aria-label="Pinned" />}
        {participant.isAudioPaused && <MicOff className="h-4 w-4 shrink-0" aria-label="Muted" />}
        <span className="truncate">{isSelf ? 'You' : (member?.displayName ?? 'Unknown')}</span>
      </div>
    </div>
  );
}

function CallMessage({ children }: { children: React.ReactNode }) {
  return <div className="grid h-full w-full place-items-center text-muted-foreground">{children}</div>;
}
