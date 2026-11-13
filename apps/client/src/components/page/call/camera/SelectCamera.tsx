'use client';
import { useLocalMedia } from '@/components/providers/LocalMediaProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export default function SelectCamera() {
  const { cameras, activeCameraId, selectCamera } = useLocalMedia();
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        aria-label="Choose camera"
        className="flex items-center rounded-full p-2 outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {open ? (
          <ChevronDown className="aspect-square h-5 w-auto" />
        ) : (
          <ChevronUp className="aspect-square h-5 w-auto" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="center"
        sideOffset={15}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <DropdownMenuLabel>Camera</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {cameras.length === 0 ? (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">No cameras found</p>
        ) : (
          <DropdownMenuRadioGroup value={activeCameraId} onValueChange={selectCamera}>
            {cameras.map((camera, index) => (
              <DropdownMenuRadioItem key={camera.deviceId} value={camera.deviceId}>
                {camera.label || `Camera ${index + 1}`}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
