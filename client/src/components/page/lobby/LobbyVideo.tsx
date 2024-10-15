"use client";
import { useUserMedia } from "@/components/providers/MediaDeviceProvider";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { PhoneOff, Video, VideoOff } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import LobbyMic from "./LobbyMic";
import { AnimatePresence, motion } from "framer-motion";

export default function LobbyVideo() {
  const [status, setStatus] = useState({
    volume: 0,
    audio: false,
    video: false,
  });
  const user_media = useUserMedia();
  const my_video_ref = useRef<HTMLVideoElement>(null);

  const [user_number, setUserNumber] = useState(4);
  useEffect(() => {
    if (!user_media || !my_video_ref.current) return;

    my_video_ref.current.srcObject = user_media;
  }, [user_media, my_video_ref.current]);

  const { cols, item_width, item_height } = useMemo(() => {
    if (user_number <= 1)
      return { cols: 1, item_height: "100%", item_width: "auto" };
    if (user_number <= 2)
      return { cols: 2, item_height: "auto", item_width: "50%" };
    if (user_number <= 4)
      return { cols: 2, item_height: "50%", item_width: "auto" };
    if (user_number <= 6)
      return { cols: 3, item_height: "auto", item_width: "33%" };
    return {
      cols: 4,
      item_width: "25%",
      item_height: "auto",
    };
  }, [user_number]);

  return (
    <section className="h-full w-full max-h-vdh overflow-hidden grid grid-rows-[1fr_auto] place-items-center bg-secondary-foreground">
      <div className="w-full h-full overflow-hidden flex flex-wrap items-center justify-center">
        <AnimatePresence initial={false}>
          {Array.from({ length: user_number })
            .slice(0, Math.min(user_number, 12))
            .map((_, index) => (
              <motion.div
                animate={{
                  width: item_width,
                  height: item_height,
                }}
                key={index}
                className={cn(
                  "relative aspect-video rounded-lg p-1",
                  index >= user_number - (user_number % cols) &&
                    user_number % cols !== 0
                    ? "sm:flex sm:justify-center"
                    : ""
                )}
              >
                <motion.video
                  key={index * 10}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  ref={my_video_ref}
                  autoPlay
                  playsInline
                  height={1080}
                  width={1920}
                  className="h-full w-full object-cover rounded-lg bg-muted "
                ></motion.video>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
      <div className="gap-4 flex  items-center justify-center px-2 py-4">
        <LobbyMic />
        <Button
          size="icon"
          onClick={() => setStatus((prev) => ({ ...prev, video: !prev.video }))}
        >
          <span className="h-4">
            {status.video ? (
              <VideoOff className="h-full w-auto" />
            ) : (
              <Video className="h-full w-auto" />
            )}
          </span>
        </Button>
        <Button size="icon" variant="destructive">
          <PhoneOff className="h-4 w-auto" />
        </Button>
      </div>
    </section>
  );
}
