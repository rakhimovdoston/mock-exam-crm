import React from "react";
import { Avatar, Button, Tooltip, Typography, theme } from "antd";
import {
  FullscreenExitOutlined,
  FullscreenOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import BrandMark from "./BrandMark";
import ThemeSwitcher from "../ThemeSwitcher";
import "../../styles/exam.css";

const { Text } = Typography;

/**
 * Top bar shared by the candidate-facing screens (HomePage and the exam hub).
 * Keeps the branding, the identity chip and the exit action identical on both.
 */
const CandidateTopBar = ({
  user,
  onExit,
  onToggleFullScreen,
  fullScreen = false,
  extra,
}) => {
  const { token } = theme.useToken();

  const initials = user
    ? `${user.firstname?.[0] ?? ""}${user.lastname?.[0] ?? ""}`.toUpperCase()
    : "";

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        height: 68,
        padding: "0 24px",
        background: token.colorBgContainer,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        flex: "0 0 auto",
      }}
    >
      <BrandMark size={50} />

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {extra}

        <ThemeSwitcher />

        {onToggleFullScreen && (
          <Tooltip title={fullScreen ? "Exit full screen" : "Full screen"}>
            <Button
              type="text"
              aria-label={fullScreen ? "Exit full screen" : "Full screen"}
              icon={
                fullScreen ? (
                  <FullscreenExitOutlined />
                ) : (
                  <FullscreenOutlined />
                )
              }
              onClick={onToggleFullScreen}
            />
          </Tooltip>
        )}

        {user && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "5px 12px 5px 5px",
              borderRadius: 999,
              background: token.colorFillTertiary,
            }}
          >
            <Avatar
              size={30}
              style={{
                background: token.colorPrimaryBg,
                color: token.colorPrimary,
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              {initials}
            </Avatar>
            <Text style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
              {user.firstname} {user.lastname}
            </Text>
          </div>
        )}

        <Button danger icon={<LogoutOutlined />} onClick={onExit}>
          Exit
        </Button>
      </div>
    </header>
  );
};

export default CandidateTopBar;
