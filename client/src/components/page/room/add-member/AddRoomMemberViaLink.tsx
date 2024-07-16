import { Button } from "@/components/ui/button";
import {
  ArrowPathIcon,
  CheckIcon,
  ClipboardIcon,
} from "@heroicons/react/24/solid";
import { useState } from "react";

export default function AddRoomMemberViaLink({
  invite_link,
  generateRoomInvite
}: {
    invite_link: string;
  generateRoomInvite(): void
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h1 className="text-lg font-bold ">Invite link</h1>
        <h2 className="text-xs"> Invite members via link</h2>
      </div>
      <div className="space-y-3 w-full">
        <div className="grid grid-cols-[1fr_auto] border rounded-lg">
          <p className="p-2 text-xs border-r break-all whitespace-pre-wrap leading-5">
            {invite_link}
          </p>
          <Button
            type="button"
            variant="ghost"
            className="h-full w-full rounded-l-none"
            onClick={() => {
              navigator.clipboard.writeText(invite_link);
              setCopied(true);
            }}
          >
            {copied ? (
              <span className="flex flex-col items-center">
                <CheckIcon className="h-5" />
                <p className="text-xs">copied</p>
              </span>
            ) : ( 
              <ClipboardIcon className="h-5" />
            )}
          </Button>
        </div>
        <Button type="button" className="w-full space-x-5" onClick={generateRoomInvite}>
          <p>Generate link</p>
          <ArrowPathIcon className="h-4 stroke-2" />
        </Button>
      </div>
    </div>
  );
}
