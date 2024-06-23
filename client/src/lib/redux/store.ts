import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useSelector } from "react-redux";
import friend_request_list_reducer from "./slices/friend-requests-slice";
import online_friends_reducer from "./slices/online-friends-slice";
import new_room_reducer from "./slices/new-room-slice";
import created_room_reducer from "./slices/created-room-slice";

export const store = configureStore({
  reducer: {
    friend_request_list_reducer,
    online_friends_reducer,
    new_room_reducer,
    created_room_reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
