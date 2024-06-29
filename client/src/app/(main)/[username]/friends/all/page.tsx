"use client";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Friend } from "@/lib/types/client-types";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import FriendList from "@/components/page/friends/FriendList";
import { Input } from "@/components/ui/input";
import useHTTPRequest from "@/components/hooks/useHTTPRequest";

export default function Page() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [search, setSearch] = useState("");
  const [search_result, setSearchResult] = useState<Friend[]>([]);
  const { data } = useSession();
  const http_request = useHTTPRequest();

  useEffect(() => {
    async function getFriends() {
      try {
        setFriends(
          (await http_request.GET(
            "/user" + data?.user.id + "/friends"
          )) as Friend[]
        );
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
            ? search_result.map((friend) => (
                <FriendList
                  key={friend.id}
                  friend={{
                    id: friend.id,
                    display_name: friend.display_name,
                    profile_photo: {
                      url: friend.profile_photo?.url!,
                    },
                    user_name: friend.user_name,
                  }}
                />
              ))
            : friends?.map((friend) => (
                <FriendList
                  key={friend.id}
                  friend={{
                    id: friend.id,
                    display_name: friend.display_name,
                    profile_photo: {
                      url: friend.profile_photo?.url!,
                    },
                    user_name: friend.user_name,
                  }}
                />
              ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
