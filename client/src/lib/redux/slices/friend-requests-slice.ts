import { FriendRequest } from "@/lib/types/client-types";
import { FriendRequestMessageType } from "@/lib/types/websocket-type";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export const friend_request_lis = createSlice({
  name: "friend_request",
  initialState: [] as FriendRequestMessageType[],
  reducers: {
    setNewFriendRequestList: (
      _,
      action: PayloadAction<FriendRequestMessageType[]>
    ) => {
      return action.payload;
    },
  },
});

export const { setNewFriendRequestList } = friend_request_lis.actions;
export default friend_request_lis.reducer;
