import { WebsocketUserType } from "@/lib/types/websocket-type";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

const online_friends = createSlice({
  name: "online-friends",
  initialState: [] as WebsocketUserType[],
  reducers: {
    setOnlineFriends: (
      prev,
      action: PayloadAction<{
        operation: "add" | "remove";
        content: WebsocketUserType;
      }>
    ) => {
      switch (action.payload.operation) {
        case "add": {
          return [...prev, action.payload.content];
        }
        case "remove":
          return prev.filter(
            (friend) => friend.user.id !== action.payload.content.user.id
          );
      }
    },
  },
});

export const { setOnlineFriends } = online_friends.actions;

export default online_friends.reducer;
