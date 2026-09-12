import { createSlice } from "@reduxjs/toolkit";
import { DEFAULT_THEME, THEME_MODES } from "../theme";

const savedLang = localStorage.getItem("lang") || "uz";

const savedTheme = THEME_MODES.includes(localStorage.getItem("theme"))
  ? localStorage.getItem("theme")
  : DEFAULT_THEME;

const appReducer = createSlice({
  name: "app",
  initialState: {
    size: "16",
    lang: savedLang,
    theme: savedTheme,
  },
  reducers: {
    changeSize: (state, action) => {
      state.size = action.payload.size;
    },
    changeLang: (state, action) => {
      state.lang = action.payload;
      localStorage.setItem("lang", action.payload);
    },
    changeTheme: (state, action) => {
      const next = THEME_MODES.includes(action.payload)
        ? action.payload
        : DEFAULT_THEME;
      state.theme = next;
      localStorage.setItem("theme", next);
    },
    toggleTheme: (state) => {
      const next = state.theme === "dark" ? "light" : "dark";
      state.theme = next;
      localStorage.setItem("theme", next);
    },
  },
});

export const { changeSize, changeLang, changeTheme, toggleTheme } =
  appReducer.actions;
export default appReducer.reducer;
