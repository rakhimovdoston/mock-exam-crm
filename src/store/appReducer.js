import { createSlice } from "@reduxjs/toolkit";

const savedLang = localStorage.getItem("lang") || "uz";

const appReducer = createSlice({
  name: "app",
  initialState: {
    size: "16",
    lang: savedLang,
  },
  reducers: {
    changeSize: (state, action) => {
      state.size = action.payload.size;
    },
    changeLang: (state, action) => {
      state.lang = action.payload;
      localStorage.setItem("lang", action.payload);
    },
  },
});

export const { changeSize, changeLang } = appReducer.actions;
export default appReducer.reducer;
