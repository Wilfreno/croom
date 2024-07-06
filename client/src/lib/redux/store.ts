import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useSelector } from "react-redux";
import online_friends from "./slices/online-friends-slice";
import new_room from "./slices/new-room-slice";
import created_room from "./slices/created-room-slice";
import ws_friend_request from "./slices/ws-friend-request-slice";

export const store = configureStore({
  reducer: {
    online_friends,
    new_room,
    created_room,
    ws_friend_request,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
