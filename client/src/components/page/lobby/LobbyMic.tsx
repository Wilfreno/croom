import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronUp,
  Mic,
  MicOff,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import React, { useState } from "react";

export default function LobbyMic() {
  const [volume, setVolume] = useState(0);
  const [mute, setMute] = useState(true);

  return (
    <div className="flex items-center bg-muted-foreground rounded-full p-1 gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="p-2 rounded-full">
            <ChevronUp className="h-full w-auto" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <div className="flex  items-center gap-4">
            <span className="h-6">
              {volume ? (
                volume > 80 ? (
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
                value={volume.toString()}
                onChange={(e) => {
                  if (!e.target.value) {
                    setVolume(0);
                    return;
                  }

                  const num = Number(e.target.value);

                  if (!num) return;
                  if (num < 0) {
                    setVolume(0);
                    return;
                  }
                  if (num > 100) {
                    setVolume(100);
                    return;
                  }

                  setVolume(num);
                }}
              />
            </div>
            <TooltipProvider disableHoverableContent delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Slider
                    className="w-28"
                    value={[volume]}
                    max={100}
                    step={1}
                    onValueChange={(values) => setVolume(values[0])}
                  />
                </TooltipTrigger>
                <TooltipContent>{volume}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              onClick={() => setMute((prev) => !prev)}
              className="p-2 rounded-full"
            >
              {mute ? (
                <Mic className="h-full w-auto" />
              ) : (
                <MicOff className="h-full w-auto" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span>{mute ? "mute" : "unmute"}</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
