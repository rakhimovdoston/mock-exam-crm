import React from "react";
import { Layout, Avatar, Dropdown, Button } from "antd";
import { Outlet, useNavigate } from "react-router-dom";
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import Navbar from "../components/Navbar";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/authReducer";
import { useT } from "../i18n/useT";

const { Header, Content } = Layout;

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useT();

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
    {
      key: "logout",
      label: t("nav.logout"),
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Navbar */}
      <Navbar />
      <Layout>
        {/* Header */}
        <Header
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            background: "white",
            position: "sticky",
            padding: "20px",
            gap: "16px",
            top: 0,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <LanguageSwitcher />
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            trigger={["click"]}
          >
            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <span className="header-title" style={{ color: "black" }}>
                {user && user.firstname + " " + user.lastname}
              </span>
              <Avatar icon={<UserOutlined />} />
            </div>
          </Dropdown>
        </Header>

        {/* Content */}
        <Content
          style={{
            padding: "20px",
            background: "#fff",
            overflowY: "auto", // Enables vertical scrolling
            height: "calc(100vh - 64px - 32px)", // Adjusts height to fit within the viewport
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
