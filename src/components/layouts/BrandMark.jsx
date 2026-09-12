import React from "react";
import { Typography, theme } from "antd";
import { logo } from "../../assets";

const { Text } = Typography;

/**
 * Everest lockup used on every candidate-facing screen — the home screen, the
 * module hub and all three exam sections — so a candidate always sees whose
 * exam they are sitting.
 */
const BrandMark = ({ size = 46 }) => {
  const { token } = theme.useToken();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <img
        src={logo}
        alt="Everest"
        style={{ height: size, display: "block" }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          lineHeight: 1.25,
          paddingInlineStart: 12,
          borderInlineStart: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Text strong style={{ fontSize: 14, whiteSpace: "nowrap" }}>
          Everest CDI
        </Text>
        <Text
          type="secondary"
          style={{
            fontSize: 11,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          Mock Exam Centre
        </Text>
      </div>
    </div>
  );
};

export default BrandMark;
