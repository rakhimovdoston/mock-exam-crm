import { createSlice } from "@reduxjs/toolkit";
import { DEFAULT_THEME, THEME_MODES } from "../theme";
import { DEFAULT_LANG, LANGS, readStoredLang, writeStoredLang } from "../i18n/lang";

// Whatever was chosen last, or English. The same value the API client puts in
// Accept-Language, so the panel and the server always speak about one language.
const savedLang = readStoredLang() ?? DEFAULT_LANG;

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
      // Ignored rather than stored if it is not a language we have: the value
      // goes out on every request from here on.
      if (!LANGS.includes(action.payload)) return;

      state.lang = action.payload;
      writeStoredLang(action.payload);
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
