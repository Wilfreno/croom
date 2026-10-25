import SideBar from '@/components/page/main/SideBar/SideBar';
import React from 'react';

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex">
      <SideBar />
      {children}
    </main>
  );
}
