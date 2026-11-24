'use client';

import { SERVER_AVAILABILITY_BANNER_PATHS, SERVER_AVAILABILITY_NOTICE } from '@repo/constants';
import { Clock } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function ServerAvailabilityBanner() {
  const pathname = usePathname();

  if (!SERVER_AVAILABILITY_BANNER_PATHS.includes(pathname)) return null;

  return (
    <div
      role="status"
      className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary px-4 py-2 text-sm font-medium text-center"
    >
      <Clock className="size-4 shrink-0" aria-hidden />
      <span>{SERVER_AVAILABILITY_NOTICE}</span>
    </div>
  );
}
