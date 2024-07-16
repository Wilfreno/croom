import { FriendRequest } from "@/lib/types/client-types";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

const ws_friend_request_slice = createSlice({
  name: "friend-request-list",
  initialState: null as FriendRequest | null,
  reducers: {
    setWSFriendRequest: (_, action: PayloadAction<FriendRequest>) => {
      return action.payload;
    },
  },
});

export const { setWSFriendRequest } = ws_friend_request_slice.actions;
export default ws_friend_request_slice.reducer;
