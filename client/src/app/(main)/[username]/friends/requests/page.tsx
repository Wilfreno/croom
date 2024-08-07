"use client";

import useFriendRequestHandler from "@/components/hooks/useFriendRequestHandler";
import FriendsRequestList from "@/components/page/friends/FriendsRequestList";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FriendRequest } from "@/lib/types/client-types";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";

export default function Page() {
  const { friend_request_list, decline, accept } = useFriendRequestHandler();
  const [search, setSearch] = useState("");
  const [search_result, setSearchResult] = useState<FriendRequest[]>([]);

  useEffect(() => {
    if (!search || !friend_request_list) return;
    setSearchResult(
      friend_request_list.filter(
        (request) =>
          request.sender!.display_name?.startsWith(search) ||
          request.sender!.user_name?.startsWith(search)
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
        <ul className="px-5">
          {search
            ? search_result.map((request, index) => (
                <FriendsRequestList
                  key={request.sender!.id}
                  request={request}
                  index={index}
                  accept={accept}
                  decline={decline}
                />
              ))
            : friend_request_list?.map((request, index) => (
                <FriendsRequestList
                  key={request.sender!.id}
                  request={request}
                  index={index}
                  accept={accept}
                  decline={decline}
                />
              ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
