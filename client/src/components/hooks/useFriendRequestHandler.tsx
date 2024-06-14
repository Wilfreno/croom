"use client";
import { useToast } from "@/components/ui/use-toast";
import { ServerResponse } from "@/lib/types/sever-response";
import {
  WebsocketClientMessage,
  WebsocketFriendRequestType,
} from "@/lib/types/websocket-type";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppDispatch, useAppSelector } from "@/lib/redux/store";
import { useDispatch } from "react-redux";
import useServerUrl from "./useServerUrl";
import { FriendRequest } from "@/lib/types/client-types";
import { setFriendRequestList } from "@/lib/redux/slices/friend-requests-slice";
import { useWebsocket } from "./useWebsocket";

export default function useFriendRequestHandler() {
  const server_url = useServerUrl();
  const friend_request_list = useAppSelector(
    (state) => state.friend_request_list_reducer
  );

  const dispatch = useDispatch<AppDispatch>();

  const { data } = useSession();
  const websocket = useWebsocket();
  const { toast } = useToast();
  const router = useRouter();

  async function getFriendRequest() {
    const response = await fetch(
      server_url + "/get/v1/friend-request/received/" + data?.user.id
    );

    const response_json = (await response.json()) as ServerResponse;
    const friend_requests = response_json.data as FriendRequest[];

    if (response_json.status === "OK")
      for (const request of friend_requests) {
        dispatch(
          setFriendRequestList({
            operation: "add",
            content: {
              sender: {
                user: {
                  id: request.sender_id,
                  display_name: request.sender?.display_name!,
                  profile_photo: {
                    photo_url: request.sender?.profile_photo?.photo_url!,
                  },
                  user_name: request.sender?.user_name!,
                },
              },
              receiver: {
                user: {
                  id: request.receiver_id,
                  display_name: request.receiver?.display_name!,
                  profile_photo: {
                    photo_url: request.receiver?.profile_photo?.photo_url!,
                  },
                  user_name: request.receiver?.user_name!,
                },
              },
              date_created: request.date_created,
            },
          })
        );
      }
    router.refresh();
  }

  async function accept(sender: WebsocketFriendRequestType["sender"]) {
    const response = await fetch(server_url + "/accept/friend-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: sender?.user.id,
        receiver: data?.user.id,
      }),
    });
    const response_json = (await response.json()) as ServerResponse;

    const payload = {
      sender,
      receiver: {
        user: {
          id: data?.user.id,
          display_name: data?.user.display_name!,
          profile_photo: {
            photo_url: data?.user.profile_photo?.photo_url!,
          },
          user_name: data?.user.user_name!,
        },
      },
    } as WebsocketFriendRequestType;

    if (response_json.status === "OK") {
      websocket?.send(
        JSON.stringify({
          type: "accept-friend-request",
          payload,
        } as WebsocketClientMessage)
      );
    } else {
      toast({
        title: "Something went wrong!",
        description: response_json.message,
      });
    }

    setTimeout(() => {
      dispatch(setFriendRequestList({ operation: "remove", content: payload }));
      router.refresh();
    }, 3000);
  }

  async function decline(sender: WebsocketFriendRequestType["sender"]) {
    const response = await fetch(server_url + "/decline/friend-request", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: sender?.user.id,
        receiver: data?.user.id,
      }),
    });
    const response_json = (await response.json()) as ServerResponse;

    if (response_json.status !== "OK") {
      toast({
        title: "Something went wrong!",
        description: response_json.message,
      });
      return;
    }

    const payload = {
      sender,
      receiver: {
        user: {
          id: data?.user.id,
          display_name: data?.user.display_name!,
          profile_photo: {
            photo_url: data?.user.profile_photo?.photo_url!,
          },
          user_name: data?.user.user_name!,
        },
      },
    } as WebsocketFriendRequestType;

    setTimeout(() => {
      dispatch(setFriendRequestList({ operation: "remove", content: payload }));

      router.refresh();
    }, 3000);
  }

  useEffect(() => {
    if (data) getFriendRequest();
  }, [data]);

  return {
    friend_request_list,
    accept,
    decline,
  };
}
