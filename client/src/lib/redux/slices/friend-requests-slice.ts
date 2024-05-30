import { FriendRequest } from "@/lib/types/client-types";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export const friend_request_lis = createSlice({
  name: "friend_request",
  initialState: [] as FriendRequest[],
  reducers: {
    setNewFriendRequestList: (_, action: PayloadAction<FriendRequest[]>) => {
      return action.payload;
    },
  },
});

export const { setNewFriendRequestList } = friend_request_lis.actions;
export default friend_request_lis.reducer;
