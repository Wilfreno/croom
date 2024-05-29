"use client";

import useWebsocket from "@/components/hooks/useWebsocket";
import Friendrequest from "@/components/page/friends/Friendrequest";
import FriendsRequestList from "@/components/page/friends/FriendsRequestList";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ServerResponse } from "@/lib/types/sever-response";
import { FriendRequest } from "@/lib/types/user-type";
import { WebSocketSeverMessage } from "@/lib/types/websocket-type";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function page() {
  const server_url = process.env.NEXT_PUBLIC_DEVELOPMENT_SERVER!;
  if (!server_url)
    throw new Error(
      "NEXT_PUBLIC_DEVELOPMENT_SERVER is missing from your .env.local file"
    );

  const { friend_requests, decline, accept } = Friendrequest();

  const [search, setSearch] = useState("");
  const [search_result, setSearchResult] = useState<FriendRequest[]>([]);

  useEffect(() => {
    if (!search || !friend_requests) return;

    setSearchResult(
      friend_requests.filter(
        (request) =>
          request.sender.display_name.startsWith(search) ||
          request.sender.user_name.startsWith(search)
      )
    );
  }, [search]);
  console.log(friend_requests);
  return (
    <div className="grow flex flex-col justify-between p-1">
      <p className="mx-5">
        FRIEND REQUESTS - {friend_requests ? friend_requests.length : 0}
      </p>
      <div className="px-5 relative">
        <Input
          id="friend-request-search"
          placeholder="Display name, Username"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Label
          htmlFor="friend-request-search"
          className="absolute top-1/2 right-8 -translate-y-1/2"
        >
          <MagnifyingGlassIcon className="h-6" />
        </Label>
      </div>
      <ScrollArea className="h-[70vh]">
        <div className="px-5">
          {search
            ? search_result.map((request, index) => (
                <FriendsRequestList
                  key={request.id}
                  request={request}
                  index={index}
                  accept={accept}
                  decline={decline}
                />
              ))
            : friend_requests?.map((request, index) => (
                <FriendsRequestList
                  key={request.id}
                  request={request}
                  index={index}
                  accept={accept}
                  decline={decline}
                />
              ))}
        </div>
      </ScrollArea>
    </div>
  );
}
