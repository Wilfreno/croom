import { Notification } from "@/lib/types/client-types";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

const notifications = createSlice({
  name: "notifications",
  initialState: [] as Notification[],
  reducers: {
    setNotification: (
      prev,
      action: PayloadAction<{
        operation: "add" | "remove";
        notification: Notification;
      }>
    ) => {
      switch (action.payload.operation) {
        case "add": {
          return [...prev, action.payload.notification];
        }
        case "remove": {
          return prev.filter(
            (notification) => notification.id !== action.payload.notification.id
          );
        }
      }
    },
  },
});

export const { setNotification } = notifications.actions;
export default notifications.reducer;
