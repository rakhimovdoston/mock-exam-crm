import React from "react";
import { Select } from "antd";
import { GlobalOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { changeLang } from "../store/appReducer";
import { LANGS } from "../i18n/useT";

const LABELS = { uz: "O'zbekcha", ru: "Русский", en: "English" };
const SHORT = { uz: "UZ", ru: "RU", en: "EN" };

const LanguageSwitcher = ({ compact = false, style }) => {
  const dispatch = useDispatch();
  const lang = useSelector((state) => state.app.lang);

  return (
    <Select
      value={lang}
      onChange={(value) => dispatch(changeLang(value))}
      variant="borderless"
      style={{ width: compact ? 88 : 130, ...style }}
      suffixIcon={<GlobalOutlined />}
      options={LANGS.map((l) => ({
        value: l,
        label: compact ? SHORT[l] : LABELS[l],
      }))}
    />
  );
};

export default LanguageSwitcher;
