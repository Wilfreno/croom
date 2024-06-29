import { Room } from "@/lib/types/client-types";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

const initialState: Room = {
  id: "",
  name: "",
  photo: {
    id: "",
    url: "",
    height: 0,
    width: 0,
  },
  type: "PRIVATE",
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
