"use client";

import useWebsocket from "@/components/hooks/useWebsocket";
import FriendList from "@/components/page/friends/FriendList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User } from "@/lib/types/client-types";
import { WebSocketSeverMessage } from "@/lib/types/websocket-type";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";

export default function page() {
  const websocket = useWebsocket();
  const [online_friends, setOnlineFriends] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [search_result, setSearchResult] = useState<User[]>();

  useEffect(() => {
    websocket?.addEventListener("message", (socket) => {
      const message = JSON.parse(socket.data) as WebSocketSeverMessage;

      console.log(message);
      if (message.type === "online") {
        setOnlineFriends((prev) => [...prev, message.payload as User]);
      }
    });
  }, [websocket]);

  console.log(online_friends);

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
                <FriendList
                  key={friend.id}
                  friend={friend}
                  setFriends={setOnlineFriends}
                  index={index}
                />
              ))
            : online_friends?.map((friend, index) => (
                <FriendList
                  key={friend.id}
                  friend={friend}
                  setFriends={setOnlineFriends}
                  index={index}
                />
              ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
