'use client';
import { useLocalMedia } from '@/components/providers/LocalMediaProvider';
import { cn } from '@/lib/utils';
import {
  CALL_TILE_ASPECT_RATIO,
  CALL_TILE_INITIAL_WIDTH,
  CALL_TILE_MAX_WIDTH_RATIO,
  CALL_TILE_MIN_WIDTH,
} from '@repo/constants';
import { VideoOff } from 'lucide-react';
import { motion, PanInfo, useDragControls, useMotionValue } from 'motion/react';
import { useEffect, useRef } from 'react';

export default function CurrentUserCam() {
  const { localMedia, isCameraOn } = useLocalMedia();
  const showVideo = localMedia.status === 'ready' && isCameraOn;
  const callAreaRef = useRef<HTMLDivElement>(null);
  const tileRef = useRef<HTMLDivElement>(null);
  const tileWidth = useMotionValue(CALL_TILE_INITIAL_WIDTH);
  const dragControls = useDragControls();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = localMedia.stream;
  }, [localMedia.stream]);

  function handleResize(_event: PointerEvent, panInfo: PanInfo) {
    const callArea = callAreaRef.current;
    const tile = tileRef.current;
    if (!callArea || !tile) return;

    const callAreaBounds = callArea.getBoundingClientRect();
    const tileBounds = tile.getBoundingClientRect();

    const spaceToTheLeft = tileBounds.right - callAreaBounds.left;
    const spaceAbove = (tileBounds.bottom - callAreaBounds.top) * CALL_TILE_ASPECT_RATIO;
    const maxTileWidth = Math.min(callAreaBounds.width * CALL_TILE_MAX_WIDTH_RATIO, spaceToTheLeft, spaceAbove);

    const requestedWidth = tileWidth.get() - panInfo.delta.x;
    tileWidth.set(Math.min(Math.max(requestedWidth, CALL_TILE_MIN_WIDTH), maxTileWidth));
  }

  return (
    <div ref={callAreaRef} className="pointer-events-none absolute inset-0">
      <motion.div
        ref={tileRef}
        drag
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={callAreaRef}
        dragElastic={0}
        dragMomentum={false}
        onPointerDown={(event) => dragControls.start(event)}
        style={{ width: tileWidth }}
        className={cn(
          'pointer-events-auto absolute right-4 bottom-4 aspect-video overflow-hidden rounded-lg',
          'border border-muted bg-slate-800 shadow-lg',
          'cursor-grab touch-none select-none active:cursor-grabbing',
        )}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            'pointer-events-none h-full w-full -scale-x-100 object-cover',
            !showVideo && 'hidden',
          )}
        />
        {!showVideo && (
          <div className="grid h-full place-items-center p-2 text-center text-sm text-muted-foreground">
            {!isCameraOn ? (
              <span className="flex flex-col items-center gap-1">
                <VideoOff className="h-6 w-6" />
                Camera is off
              </span>
            ) : localMedia.status === 'loading' ? (
              'Starting camera…'
            ) : (
              localMedia.error
            )}
          </div>
        )}

        <motion.div
          aria-label="Resize camera"
          onPointerDown={(event) => event.stopPropagation()} // don't start a drag from the handle
          onPan={handleResize}
          className="absolute left-0 top-0 h-4 w-4 cursor-nwse-resize touch-none rounded-br bg-white/40"
        />
      </motion.div>
    </div>
  );
}
