"use client";
import useServerUrl from "@/components/hooks/useServerUrl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Friend, Friendship, User } from "@/lib/types/client-types";
import { ServerResponse } from "@/lib/types/sever-response";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function AddRoomMember() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const { data } = useSession();
  const server_url = useServerUrl();
  const { toast } = useToast();

  async function sendRoomInvite() {
    try {
      const response = await fetch(server_url + "/v1/room/send-invite", {
        method: "POST",
        headers: {
          "Content-Type" : "application/json"
        },
        body: JSON.stringify({})
      })
    } catch (error) {
      throw error
    }
  }

  useEffect(() => {
    if (!data) return;

    async function getFriends() {
      try {
        const response = await fetch(
          server_url + "/v1/user/" + data?.user.id + "/friends"
        );

        const response_json = (await response.json()) as ServerResponse;

        if (response_json.status !== "OK") {
          toast({
            title: "Oop! something went wrong",
            description: response_json.message,
          });

          return;
        }
        setFriends(response_json.data as Friend[]);
      } catch (error) {
        throw error;
      }
    }
    getFriends();
  }, [data]);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button"> Add Member</Button>
      </DialogTrigger>
      <DialogContent>
        <div></div>
        <form>
          <Input />
          <Button type="button">invite</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
