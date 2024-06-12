import { FriendRequest } from "@/lib/types/client-types";
import { WebsocketFriendRequestType } from "@/lib/types/websocket-type";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export const friend_request_list = createSlice({
  name: "friend_request",
  initialState: [] as WebsocketFriendRequestType[],
  reducers: {
    setNewFriendRequestList: (
      _,
      action: PayloadAction<WebsocketFriendRequestType[]>
    ) => {
      return action.payload;
    },
  },
});

export const { setNewFriendRequestList } = friend_request_list.actions;
export default friend_request_list.reducer;
