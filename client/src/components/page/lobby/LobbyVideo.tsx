"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Mic,
  MicOff,
  PhoneOff,
  Video,
  VideoOff,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import React, { useState } from "react";

export default function LobbyVideo() {
  const [status, setStatus] = useState({
    volume: 0,
    audio: false,
    video: false,
  });

  return (
    <section className="flex flex-col w-full h-full max-h-dvh bg-secondary items-center justify-center">
      <div className="aspect-video w-full h-auto max-w-[80vw] bg-secondary-foreground relative">
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 gap-12  flex">
          <div className="flex items-center gap-2">
            <span className="h-6">
              {status.volume ? (
                status.volume > 80 ? (
                  <Volume2 className="h-full w-auto stroke-primary" />
                ) : (
                  <Volume1 className="h-full w-auto stroke-primary" />
                )
              ) : (
                <VolumeX className="h-full w-auto stroke-primary" />
              )}
            </span>
            <div>
              <Input
                className="w-12 h-auto text-xs bg-primary text-center"
                type="text"
                inputMode="numeric"
                id="custom"
                max={100}
                min={0}
                value={status.volume.toString()}
                onChange={(e) => {
                  if (!e.target.value) {
                    setStatus((prev) => ({
                      ...prev,
                      volume: 0,
                    }));
                    return;
                  }
                  if (!Number(e.target.value)) return;
                  if (Number(e.target.value) < 0) {
                    setStatus((prev) => ({
                      ...prev,
                      volume: 0,
                    }));
                    return;
                  }
                  if (Number(e.target.value) > 100) {
                    setStatus((prev) => ({
                      ...prev,
                      volume: 100,
                    }));
                    return;
                  }

                  setStatus((prev) => ({
                    ...prev,
                    volume: Number(e.target.value),
                  }));
                }}
              />
            </div>
            <TooltipProvider disableHoverableContent delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Slider
                    className="w-28"
                    value={[status.volume]}
                    max={100}
                    step={1}
                    onValueChange={(e) =>
                      setStatus((prev) => ({ ...prev, volume: e[0] }))
                    }
                  />
                </TooltipTrigger>
                <TooltipContent>{status.volume}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex gap-4">
            <Button
              size="icon"
              onClick={() =>
                setStatus((prev) => ({ ...prev, audio: !prev.audio }))
              }
            >
              <span className="h-4">
                {status.audio ? (
                  <MicOff className="h-full w-auto" />
                ) : (
                  <Mic className="h-full w-auto" />
                )}
              </span>
            </Button>
            <Button
              size="icon"
              onClick={() =>
                setStatus((prev) => ({ ...prev, video: !prev.video }))
              }
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
        </div>
      </div>
    </section>
  );
}
