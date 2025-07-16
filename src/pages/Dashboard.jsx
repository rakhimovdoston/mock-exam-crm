import React, { useState } from "react";
import { Layout, Avatar, Dropdown, Button, Tooltip } from "antd";
import { Outlet, useNavigate } from "react-router-dom";
import {
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import Navbar from "../components/Navbar";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/authReducer";

const { Header, Content } = Layout;

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout()); // Dispatch logout action
    navigate("/login"); // Redirect to login page
  };

  const [collapsed, setCollapsed] = useState(false);

  const userMenuItems = [
    {
      key: "username",
      label: (
        <span style={{ fontWeight: "600", color: "#1e293b" }}>
          {user?.firstname} {user?.lastname}
        </span>
      ),
      // disabled: true,
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: "Logout",
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Navbar */}
      <Navbar collapsed={collapsed} />
      <Layout>
        {/* Header */}
        <Header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "white",
            position: "sticky",
            padding: "20px",
            top: 0,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Tooltip
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            placement="right"
          >
            <div
              onClick={() => setCollapsed(!collapsed)}
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(158, 92, 92, 0.1)",
                transition: "all 0.3s",
                marginLeft: "12px",
              }}
            >
              {collapsed ? (
                <MenuUnfoldOutlined
                  style={{ fontSize: 16, color: "#1e293b" }}
                />
              ) : (
                <MenuFoldOutlined style={{ fontSize: 16, color: "#1e293b" }} />
              )}
            </div>
          </Tooltip>
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
              <Avatar
                style={{ backgroundColor: "#00a2ae", verticalAlign: "middle" }}
                size="large"
              >
                {user?.firstname.substring(0, 1)}
              </Avatar>
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
