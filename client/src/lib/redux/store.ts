import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useSelector } from "react-redux";
import online_friends_reducer from "./slices/online-friends-slice";
import new_room_reducer from "./slices/new-room-slice";
import created_room_reducer from "./slices/created-room-slice";
import notification_reducer from "./slices/notification-slice";

export const store = configureStore({
  reducer: {
    online_friends_reducer,
    new_room_reducer,
    created_room_reducer,
    notification_reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
