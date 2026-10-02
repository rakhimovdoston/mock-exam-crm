/**
 * The app's language, in the one place both React and the API client can read.
 *
 * Deliberately free of React and Redux: the axios interceptor runs outside any
 * component and outside the store, so it reads the stored value directly. The
 * store writes through the same helpers, which is what keeps the header and
 * the panel from ever disagreeing about what language this is.
 */

export const LANGS = ["uz", "ru", "en"];

/** Used until someone chooses otherwise, for the panel and for the header. */
export const DEFAULT_LANG = "en";

export const LANG_STORAGE_KEY = "lang";

/**
 * The chosen language, or null if there is none to be had.
 *
 * Validated against the supported list rather than trusted: storage is shared
 * with whatever else ran on this machine, and an unknown tag would be sent on
 * every request for as long as it sat there.
 */
export const readStoredLang = () => {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    return LANGS.includes(stored) ? stored : null;
  } catch {
    // Private window, or storage blocked. The default covers it.
    return null;
  }
};

export const writeStoredLang = (lang) => {
  if (!LANGS.includes(lang)) return;

  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // The language still applies to this session; it just will not outlive it.
  }
};

/** What goes on the wire in `Accept-Language`. */
export const getRequestLanguage = () => readStoredLang() ?? DEFAULT_LANG;
