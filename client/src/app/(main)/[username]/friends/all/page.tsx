"use client";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ServerResponse } from "@/lib/types/sever-response";
import { User } from "@/lib/types/client-types";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import FriendList from "@/components/page/friends/FriendList";
import { Input } from "@/components/ui/input";

export default function Page() {
  const [friends, setFriends] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [search_result, setSearchResult] = useState<User[]>([]);
  const { data } = useSession();

  useEffect(() => {
    async function getFriends() {
      const server_url = process.env.NEXT_PUBLIC_DEVELOPMENT_SERVER!;
      if (!server_url)
        throw new Error(
          "DEVELOPMENT_SERVER is missing from your .env.local file"
        );

      try {
        const response = await fetch(
          server_url + "/v1/get/friends/" + data?.user.id
        );
        const response_json = (await response.json()) as ServerResponse;

        if (response_json.status === "OK")
          setFriends(response_json.data as User[]);
      } catch (error) {
        throw error;
      }
    }
    if (data) getFriends();
  }, [data]);

  useEffect(() => {
    if (!search || !friends) return;

    setSearchResult(
      friends.filter(
        (user) =>
          user.display_name?.startsWith(search) ||
          user.user_name?.startsWith(search)
      )
    );
  }, [search]);

  return (
    <div className="grow flex flex-col justify-between p-1">
      <p className="mx-5">ALL FRIENDS - {friends ? friends.length : 0}</p>
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
        <ul className="px-3 space-y-5">
          {search
            ? search_result.map((friend, index) => (
                <Friege ndList
                  key={friend.id}
                  friend={friend}
                  setFriends={setFriends}
                  index={index}
                />
              ))
            : friends?.map((friend, index) => (
                <FriendList
                  key={friend.id}
                  friend={friend}
                  setFriends={setFriends}
                  index={index}
                />
              ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
