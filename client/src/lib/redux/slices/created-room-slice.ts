import { Room } from "@/lib/types/client-types";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

const created_room = createSlice({
  name: "create-room",
  initialState: null as Room | null,
  reducers: {
    setCreatedRoom: (_, action: PayloadAction<Room>) => {
      return action.payload;
    },
  },
});

export const { setCreatedRoom } = created_room.actions;

export default created_room.reducer;
