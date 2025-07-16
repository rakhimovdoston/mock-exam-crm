import React from "react";
import { Image, Layout, Menu, theme, Tooltip } from "antd";
import {
  UserOutlined,
  FileTextOutlined,
  SoundOutlined,
  BookOutlined,
  EditOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.jpeg";
import { logout } from "../store/authReducer";
import { useDispatch } from "react-redux";

const { Sider } = Layout;

const Navbar = ({ collapsed }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const selectedKey = location.pathname || "/dashboard";

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login"); // Redirect to login page
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      width={220}
      trigger={null}
      style={{
        position: "relative",
        background: colorBgContainer, // dark blue
        // boxShadow: "2px 0 8px rgba(0, 0, 0, 0.1)",
        minHeight: "100vh",
      }}
    >
      <div
        className="logo"
        style={{
          textAlign: "center",
          padding: "16px",
          transition: "all 0.3s ease",
        }}
      >
        <Link to="/dashboard">
          <Image
            src={logo}
            alt="Mock Exam Logo"
            preview={false}
            width={collapsed ? 40 : 120}
            style={{
              borderRadius: "10px",
              boxShadow: "0 4px 10px rgba(255, 255, 255, 0.1)",
              transition: "all 0.3s ease",
            }}
          />
        </Link>
      </div>

      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[selectedKey]}
        defaultOpenKeys={["/dashboard/ielts"]}
        style={{
          // backgroundColor: "#0f172a",
          fontWeight: "500",
        }}
        items={[
          {
            key: "/dashboard",
            icon: <FileTextOutlined />,
            label: <Link to="/dashboard">Home</Link>,
          },
          {
            key: "/dashboard/users",
            icon: <UserOutlined />,
            label: <Link to="/dashboard/users">Users</Link>,
          },
          {
            key: "/dashboard/ielts/listening",
            icon: <SoundOutlined />,
            label: <Link to="/dashboard/ielts/listening">Listening</Link>,
          },
          {
            key: "/dashboard/ielts/reading",
            icon: <BookOutlined />,
            label: <Link to="/dashboard/ielts/reading">Reading</Link>,
          },
          {
            key: "/dashboard/ielts/writing",
            icon: <EditOutlined />,
            label: <Link to="/dashboard/ielts/writing">Writing</Link>,
          },
          {
            key: "logout",
            icon: <LogoutOutlined />,
            label: (
              <span onClick={handleLogout} style={{ cursor: "pointer" }}>
                Logout
              </span>
            ),
            style: {
              color: "red",
              position: "absolute",
              bottom: 0,
            },
          },
        ]}
      />
    </Sider>
  );
};

export default Navbar;
