"use client";

import useFriendRequestHandler from "@/components/hooks/useFriendRequestHandler";
import FriendsRequestList from "@/components/page/friends/FriendsRequestList";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WebsocketFriendRequestType } from "@/lib/types/websocket-type";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";

export default function page() {
  const server_url = process.env.NEXT_PUBLIC_DEVELOPMENT_SERVER!;
  if (!server_url)
    throw new Error(
      "NEXT_PUBLIC_DEVELOPMENT_SERVER is missing from your .env.local file"
    );

  const { friend_request_list, decline, accept } = useFriendRequestHandler();
  const [search, setSearch] = useState("");
  const [search_result, setSearchResult] = useState<
    WebsocketFriendRequestType[]
  >([]);

  useEffect(() => {
    if (!search || !friend_request_list) return;

    setSearchResult(
      friend_request_list.filter(
        (request) =>
          request.sender.user.display_name?.startsWith(search) ||
          request.sender.user.user_name?.startsWith(search)
      )
    );
  }, [search]);

  return (
    <div className="grow flex flex-col justify-between p-1">
      <p className="mx-5">
        FRIEND REQUESTS - {friend_request_list ? friend_request_list.length : 0}
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
                  key={request.receiver.user.id}
                  request={request}
                  index={index}
                  accept={accept}
                  decline={decline}
                />
              ))
            : friend_request_list?.map((request, index) => (
                <FriendsRequestList
                  key={request.sender.user.id}
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
