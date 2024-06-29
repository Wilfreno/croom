"use client";

import FriendList from "@/components/page/friends/FriendList";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppSelector } from "@/lib/redux/store";
import { WebsocketUserType } from "@/lib/types/websocket-type";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";

export default function Page() {
  const online_friends = useAppSelector(
    (state) => state.online_friends_reducer
  );

  const [search, setSearch] = useState("");
  const [search_result, setSearchResult] = useState<WebsocketUserType[]>();

  useEffect(() => {
    if (!search || online_friends.length < 1) return;

    setSearchResult(
      online_friends.filter((friend) =>
        friend.display_name.startsWith("search")
      )
    );
  }, [search]);

  return (
    <div className="grow flex flex-col justify-between p-1">
      <p className="mx-5">
        ONLINE FRIENDS - {online_friends ? online_friends.length : 0}
      </p>
      <div className="px-5 relative">
        <Input
          id="friend-search"
          placeholder="Display name, Username"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Label
          htmlFor="friend-search"
          className="absolute top-1/2 right-8 -translate-y-1/2"
        >
          <MagnifyingGlassIcon className="h-6" />
        </Label>
      </div>
      <ScrollArea className="h-[70vh]">
        <ul className="px-3 space-y-3">
          {search
            ? search_result?.map((friend, index) => (
                <FriendList key={friend.id} friend={friend} />
              ))
            : online_friends?.map((friend, index) => (
                <FriendList key={friend.id} friend={friend} />
              ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
