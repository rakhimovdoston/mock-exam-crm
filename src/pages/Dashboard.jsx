import React from "react";
import { Layout, Avatar, Dropdown, Typography, theme } from "antd";
import { Outlet, useNavigate } from "react-router-dom";
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  DownOutlined,
} from "@ant-design/icons";
import Navbar from "../components/Navbar";
import LanguageSwitcher from "../components/LanguageSwitcher";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/authReducer";
import { useT } from "../i18n/useT";

const { Header, Content } = Layout;
const { Text } = Typography;

const HEADER_HEIGHT = 64;

const ROLE_LABELS = {
  ROLE_ADMIN: "Admin",
  ROLE_BRANCH_ADMIN: "Mock Organiser",
  ROLE_SPEAKER: "Speaking Examiner",
};

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useT();
  const { token } = theme.useToken();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const userMenuItems = [
    {
      key: "settings",
      label: t("nav.settings"),
      icon: <SettingOutlined />,
      onClick: () => navigate("/dashboard/settings"),
    },
    { type: "divider" },
    {
      key: "logout",
      label: t("nav.logout"),
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  const fullName = user ? `${user.firstname} ${user.lastname}` : "";
  const roleLabel = ROLE_LABELS[user?.roles?.[0]] ?? "";
  const initials = user
    ? `${user.firstname?.[0] ?? ""}${user.lastname?.[0] ?? ""}`.toUpperCase()
    : "";

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Navbar />
      <Layout>
        <Header
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 8,
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <ThemeSwitcher />
          <LanguageSwitcher compact />

          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            trigger={["click"]}
          >
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                cursor: "pointer",
                padding: "6px 8px",
                borderRadius: token.borderRadius,
                transition: "background 0.2s ease",
              }}
            >
              <Avatar
                style={{
                  background: token.colorPrimaryBg,
                  color: token.colorPrimary,
                  fontWeight: 600,
                }}
              >
                {initials || <UserOutlined />}
              </Avatar>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  lineHeight: 1.25,
                }}
              >
                <Text className="header-title" style={{ fontSize: 14 }}>
                  {fullName}
                </Text>
                {roleLabel && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {roleLabel}
                  </Text>
                )}
              </div>
              <DownOutlined
                style={{ fontSize: 10, color: token.colorTextTertiary }}
              />
            </div>
          </Dropdown>
        </Header>

        <Content
          style={{
            padding: 24,
            height: `calc(100vh - ${HEADER_HEIGHT}px)`,
            overflowY: "auto",
            background: token.colorBgLayout,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
