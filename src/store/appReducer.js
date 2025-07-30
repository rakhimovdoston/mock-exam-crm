import { createSlice } from "@reduxjs/toolkit";

const appReducer = createSlice({
  name: "app",
  initialState: {
    size: "16",
  },
  reducers: {
    changeSize: (state, action) => {
      state.size = action.payload.size;
    },
  },
});

export const { changeSize } = appReducer.actions;
export default appReducer.reducer;
