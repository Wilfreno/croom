'use client';
import { Button } from '@/components/ui/button';
import { CaseSensitive } from 'lucide-react';
import NicknamesDialog from './NicknamesDialog';

export default function AddNickname() {
  return (
    <NicknamesDialog
      trigger={
        <Button variant="ghost" className="w-full justify-start">
          <span className="aspect-square h-fit w-auto bg-secondary p-2 rounded-full">
            <CaseSensitive className="h-4 w-auto text-primary" />
          </span>
          <span>Add nicknames</span>
        </Button>
      }
    />
  );
}
