import { theme as antdTheme } from "antd";

/**
 * Single source of truth for the admin panel's look.
 * Colours come from the Everest logo: indigo mark + crimson wordmark.
 *
 * Keep the CSS variables in src/index.css in sync with the values here —
 * they cover the plain elements antd does not render.
 */
export const BRAND = {
  indigo: "#3F4196",
  indigoDarkMode: "#7B80E0",
  crimson: "#E5233D",
};

export const THEME_MODES = ["light", "dark"];
export const DEFAULT_THEME = "light";

// Tokens that never depend on light/dark.
const sharedToken = {
  fontFamily: `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
  fontSize: 14,
  fontSizeSM: 12,
  fontSizeLG: 16,
  fontSizeHeading1: 28,
  fontSizeHeading2: 22,
  fontSizeHeading3: 18,
  fontSizeHeading4: 16,
  fontSizeHeading5: 14,
  lineHeight: 1.5715,

  borderRadius: 10,
  borderRadiusLG: 14,
  borderRadiusSM: 8,
  borderRadiusXS: 6,

  controlHeight: 38,
  controlHeightLG: 44,
  controlHeightSM: 30,

  colorSuccess: "#12B76A",
  colorWarning: "#F79009",
  colorError: BRAND.crimson,

  wireframe: false,
};

const lightToken = {
  ...sharedToken,
  colorPrimary: BRAND.indigo,
  colorInfo: BRAND.indigo,
  colorLink: BRAND.indigo,
  colorLinkHover: "#5A5CBE",

  colorBgLayout: "#F6F7F9",
  colorBgContainer: "#FFFFFF",
  colorBgElevated: "#FFFFFF",
  colorBgSpotlight: "#101828",

  colorBorder: "#E4E7EC",
  colorBorderSecondary: "#EFF1F4",

  colorText: "#101828",
  colorTextSecondary: "#475467",
  colorTextTertiary: "#667085",
  colorTextQuaternary: "#98A2B3",

  colorFillSecondary: "#F2F4F7",
  colorFillTertiary: "#F6F7F9",
  colorFillQuaternary: "#FAFBFC",

  boxShadowTertiary: "0 1px 2px rgba(16, 24, 40, 0.06)",
};

const darkToken = {
  ...sharedToken,
  colorPrimary: BRAND.indigoDarkMode,
  colorInfo: BRAND.indigoDarkMode,
  colorLink: "#8F94E8",
  colorLinkHover: "#ADB1F0",

  // Deliberately not near-black on near-white: body text lands around 11:1
  // instead of 15:1, which stops light glyphs from haloing on long passages.
  colorBgLayout: "#12151C",
  colorBgContainer: "#191D26",
  colorBgElevated: "#1F2430",
  colorBgSpotlight: "#2A3140",

  colorBorder: "#2A3140",
  colorBorderSecondary: "#232935",

  colorText: "#CCD1DA",
  colorTextSecondary: "#AAB1BE",
  colorTextTertiary: "#8B93A1",
  colorTextQuaternary: "#6C7585",

  colorFillSecondary: "#20242E",
  colorFillTertiary: "#1B1F28",
  colorFillQuaternary: "#171B23",

  boxShadowTertiary: "0 1px 2px rgba(0, 0, 0, 0.4)",
};

// Sider keeps its own dark surface in both themes — it anchors the layout.
const SIDER_BG = { light: "#141731", dark: "#15181F" };

const buildComponents = (mode, token) => {
  const isLight = mode === "light";
  const focusRing = isLight
    ? "0 0 0 3px rgba(63, 65, 150, 0.12)"
    : "0 0 0 3px rgba(123, 128, 224, 0.20)";

  return {
    Layout: {
      headerBg: token.colorBgContainer,
      headerHeight: 64,
      headerPadding: "0 24px",
      bodyBg: token.colorBgLayout,
      siderBg: SIDER_BG[mode],
      triggerBg: SIDER_BG[mode],
      triggerColor: "rgba(255, 255, 255, 0.65)",
    },
    Menu: {
      darkItemBg: "transparent",
      darkSubMenuItemBg: "transparent",
      darkPopupBg: SIDER_BG[mode],
      darkItemColor: "rgba(255, 255, 255, 0.70)",
      darkItemHoverBg: "rgba(255, 255, 255, 0.08)",
      darkItemHoverColor: "#FFFFFF",
      darkItemSelectedBg: "rgba(255, 255, 255, 0.14)",
      darkItemSelectedColor: "#FFFFFF",
      itemBorderRadius: 8,
      itemMarginInline: 10,
      itemMarginBlock: 2,
      itemHeight: 42,
      iconMarginInlineEnd: 12,
    },
    Card: {
      paddingLG: 20,
      headerHeight: 54,
      headerFontSize: 16,
      borderRadiusLG: 14,
      boxShadowTertiary: token.boxShadowTertiary,
    },
    Table: {
      headerBg: isLight ? "#F9FAFB" : "#20242E",
      headerColor: token.colorTextTertiary,
      headerSplitColor: "transparent",
      headerBorderRadius: 12,
      rowHoverBg: isLight ? "#F9FAFB" : "#20242E",
      borderColor: token.colorBorderSecondary,
      cellPaddingBlock: 12,
      cellPaddingInline: 16,
      footerBg: "transparent",
    },
    Input: {
      paddingBlock: 7,
      activeShadow: focusRing,
      hoverBorderColor: token.colorPrimary,
      activeBorderColor: token.colorPrimary,
    },
    InputNumber: {
      paddingBlock: 7,
      activeShadow: focusRing,
      hoverBorderColor: token.colorPrimary,
      activeBorderColor: token.colorPrimary,
    },
    Select: {
      optionSelectedBg: isLight ? "#F1F1FB" : "#262B45",
      optionSelectedFontWeight: 600,
      optionPadding: "7px 12px",
      activeOutlineColor: focusRing,
      hoverBorderColor: token.colorPrimary,
      activeBorderColor: token.colorPrimary,
    },
    DatePicker: {
      activeShadow: focusRing,
      hoverBorderColor: token.colorPrimary,
      activeBorderColor: token.colorPrimary,
      cellActiveWithRangeBg: isLight ? "#F1F1FB" : "#262B45",
    },
    Button: {
      fontWeight: 500,
      paddingInline: 16,
      primaryShadow: "none",
      defaultShadow: "none",
      dangerShadow: "none",
    },
    Modal: {
      borderRadiusLG: 16,
      titleFontSize: 17,
      headerBg: "transparent",
      contentBg: token.colorBgElevated,
    },
    Tag: {
      borderRadiusSM: 999,
      defaultBg: token.colorFillSecondary,
      defaultColor: token.colorTextSecondary,
    },
    Form: {
      labelColor: token.colorTextSecondary,
      labelFontSize: 13,
      itemMarginBottom: 18,
      verticalLabelPadding: "0 0 6px",
    },
    Statistic: {
      titleFontSize: 13,
      contentFontSize: 28,
    },
    Segmented: {
      itemSelectedBg: token.colorBgContainer,
      trackBg: token.colorFillSecondary,
      borderRadius: 8,
    },
    Tabs: {
      itemSelectedColor: token.colorPrimary,
      inkBarColor: token.colorPrimary,
      horizontalItemPadding: "10px 0",
    },
    Descriptions: {
      labelBg: isLight ? "#F9FAFB" : "#20242E",
      titleMarginBottom: 12,
    },
    Tooltip: {
      borderRadius: 8,
    },
    Divider: {
      colorSplit: token.colorBorderSecondary,
    },
    Alert: {
      borderRadiusLG: 12,
    },
    Empty: {
      colorTextDescription: token.colorTextTertiary,
    },
  };
};

/** antd ConfigProvider `theme` object for the given mode. */
export const getThemeConfig = (mode = DEFAULT_THEME) => {
  const isLight = mode !== "dark";
  const token = isLight ? lightToken : darkToken;

  return {
    algorithm: isLight ? antdTheme.defaultAlgorithm : antdTheme.darkAlgorithm,
    token,
    components: buildComponents(isLight ? "light" : "dark", token),
  };
};

export default getThemeConfig;
