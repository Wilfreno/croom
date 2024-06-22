import { Room } from "@/lib/types/client-types";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

const initialState: Room = {
  room_name: "",
  room_photo: {
    photo_url: "",
    height: 0,
    width: 0,
  },
  room_type: "PRIVATE",
};

const new_room = createSlice({
  name: "new-room",
  initialState,
  reducers: {
    setNewRoom: (_, action: PayloadAction<Room>) => {
      return action.payload;
    },
  },
});

export const { setNewRoom } = new_room.actions;

export default new_room.reducer;
