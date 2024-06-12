import { FriendRequest } from "@/lib/types/client-types";
import { WebsocketFriendRequestType } from "@/lib/types/websocket-type";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export const friend_request_list = createSlice({
  name: "friend_request",
  initialState: [] as WebsocketFriendRequestType[],
  reducers: {
    setFriendRequestList: (
      prev,
      action: PayloadAction<{
        operation: "add" | "remove";
        content: WebsocketFriendRequestType;
      }>
    ) => {
      switch (action.payload.operation) {
        case "add":
          return [...prev, action.payload.content];
        case "remove":
          return prev.filter(
            (request) =>
              !(
                request.sender.user.id ===
                  action.payload.content.sender.user.id &&
                request.receiver.user.id ===
                  action.payload.content.receiver.user.id
              )
          );
      }
    },
  },
});

export const { setFriendRequestList } = friend_request_list.actions;
export default friend_request_list.reducer;
