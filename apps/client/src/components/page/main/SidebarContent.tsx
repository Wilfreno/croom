import { cn } from '@/lib/utils';
import React from 'react';

export default function SidebarContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn('border shadow md:rounded-md bg-background w-[20dvw]', className)}>{children}</section>;
}
