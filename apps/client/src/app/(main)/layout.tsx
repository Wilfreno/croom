import SideBar from '@/components/page/main/SideBar/SideBar';
import React from 'react';

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid grid-cols-[auto_1fr_auto] gap-1">
      <SideBar />
      {children}
    </main>
  );
}
