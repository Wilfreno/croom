"use client";
import useHTTPRequest from "@/components/hooks/useHTTPRequest";
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
  const { toast } = useToast();
  const http_request = useHTTPRequest()

  async function sendRoomInvite() {
    try {
      
      const room_invite = await http_request.POST("/v1/room/invite", {

      }) as 
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
