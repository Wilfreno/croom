'use client';
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

export default function SelectDevice({
  label,
  devices,
  activeDeviceId,
  onSelect,
}: {
  label: string;
  devices: MediaDeviceInfo[];
  activeDeviceId?: string;
  onSelect: (deviceId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const lowerCaseLabel = label.toLowerCase();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        aria-label={`Choose ${lowerCaseLabel}`}
        className="flex h-11 w-9 items-center justify-center rounded-full text-white/80 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 data-[state=open]:bg-white/10 data-[state=open]:text-white"
      >
        {open ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronUp className="h-4 w-4" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="center"
        sideOffset={15}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {devices.length === 0 ? (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">No {lowerCaseLabel}s found</p>
        ) : (
          <DropdownMenuRadioGroup value={activeDeviceId} onValueChange={onSelect}>
            {devices.map((device, index) => (
              <DropdownMenuRadioItem key={device.deviceId} value={device.deviceId}>
                {device.label || `${label} ${index + 1}`}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
