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
