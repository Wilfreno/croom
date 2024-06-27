"use client";
import { useToast } from "@/components/ui/use-toast";
import { ServerResponse } from "@/lib/types/sever-response";
import { WebsocketFriendRequestType } from "@/lib/types/websocket-type";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppDispatch, useAppSelector } from "@/lib/redux/store";
import { useDispatch } from "react-redux";
import { FriendRequest } from "@/lib/types/client-types";
import { setFriendRequestList } from "@/lib/redux/slices/friend-requests-slice";
import { useWebsocket } from "./useWebsocket";
import useHTTPRequest from "./useHTTPRequest";
import websocketMessage from "@/lib/websocket-message";

export default function useFriendRequestHandler() {
  const friend_request_list = useAppSelector(
    (state) => state.friend_request_list_reducer
  );

  const dispatch = useDispatch<AppDispatch>();

  const { data } = useSession();
  const websocket = useWebsocket();
  const { toast } = useToast();
  const router = useRouter();
  const http_request = useHTTPRequest();

  async function getFriendRequest() {
    try {
      const friend_requests = (await http_request.GET(
        "/v1/user/" + data!.user.id + "/friend-request/received"
      )) as FriendRequest[];

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
                    url: request.sender?.profile_photo?.url!,
                  },
                  user_name: request.sender?.user_name!,
                },
              },
              receiver: {
                user: {
                  id: request.receiver_id,
                  display_name: request.receiver?.display_name!,
                  profile_photo: {
                    url: request.receiver?.profile_photo?.url!,
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
    } catch (error) {
      throw error;
    }
  }

  async function accept(sender: WebsocketFriendRequestType["sender"]) {
    try {
      await http_request.POST("/v1/friend-request/accept", {
        sender_id: sender.user.id,
        receiver_id: data?.user.id,
      });

      const payload = {
        sender,
        receiver: {
          user: {
            id: data?.user.id,
            display_name: data?.user.display_name!,
            profile_photo: {
              url: data?.user.profile_photo?.url!,
            },
            user_name: data?.user.user_name!,
          },
        },
      } as WebsocketFriendRequestType;

      websocket?.send(websocketMessage("accept-friend-request", payload));

      setTimeout(() => {
        dispatch(
          setFriendRequestList({ operation: "remove", content: payload })
        );
        router.refresh();
      }, 3000);
    } catch (error) {
      throw error;
    }
  }

  async function decline(sender: WebsocketFriendRequestType["sender"]) {
    try {
      await http_request.DELETE("/v1/friend-request/decline", {
        sender_id: sender.user.id,
        receiver_id: data?.user.id,
      });

      const payload = {
        sender,
        receiver: {
          user: {
            id: data?.user.id,
            display_name: data?.user.display_name!,
            profile_photo: {
              url: data?.user.profile_photo?.url!,
            },
            user_name: data?.user.user_name!,
          },
        },
      } as WebsocketFriendRequestType;

      setTimeout(() => {
        dispatch(
          setFriendRequestList({ operation: "remove", content: payload })
        );

        router.refresh();
      }, 3000);
    } catch (error) {
      throw error;
    }
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
