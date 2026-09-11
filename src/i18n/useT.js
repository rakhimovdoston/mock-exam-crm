import { useSelector } from "react-redux";
import translations from "./translations";

export const LANGS = ["uz", "ru", "en"];
export const DEFAULT_LANG = "uz";

// Resolve a dot-path key ("nav.dashboard") from an object.
const resolve = (obj, path) =>
  path.split(".").reduce((acc, part) => (acc ? acc[part] : undefined), obj);

// useT() → t("nav.dashboard"). Falls back: current lang → uz → the key itself.
export const useT = () => {
  const lang = useSelector((state) => state.app.lang) || DEFAULT_LANG;

  const t = (key) => {
    const value =
      resolve(translations[lang], key) ??
      resolve(translations[DEFAULT_LANG], key);
    return value ?? key;
  };

  t.lang = lang;
  return t;
};

export default useT;
