import React, { useState } from "react";
import { Image, Layout, Menu } from "antd";
import {
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import logo from "../assets/logo.jpeg";
import { Link } from "react-router-dom";

const { Sider } = Layout;

const Navbar = () => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const deftaultSelectedKey = location.pathname || "/dashboard";

  return (
    <Sider collapsible collapsed={collapsed} onCollapse={toggleCollapse}>
      <div
        className="logo"
        style={{ color: "white", textAlign: "center", padding: "16px" }}
      >
        <Link to="/dashboard">
          <Image
            src={logo}
            style={{ borderRadius: "8px" }}
            alt="Mock Exam Logo"
            width={collapsed ? 40 : 100} // Adjust size based on collapsed state
            preview={false}
          />
        </Link>
      </div>

      <Menu
        theme="dark"
        mode="inline"
        defaultSelectedKeys={[deftaultSelectedKey]}
        items={[
          {
            key: "/dashboard",
            icon: <FileTextOutlined />,
            label: <Link to="/dashboard">Dashboard</Link>,
          },
          {
            key: "/dashboard/users",
            icon: <UserOutlined />,
            label: <Link to="/dashboard/users">Students</Link>,
          },
          {
            key: "/dashboard/contest",
            icon: <TrophyOutlined />,
            label: <Link to="/dashboard/contest">Contests</Link>,
          },
          {
            key: "/dashboard/ielts",
            icon: <ExclamationCircleOutlined />,
            label: "IELTS",
            children: [
              {
                key: "/dashboard/ielts/listening",
                label: <Link to="/dashboard/ielts/listening">Listening</Link>,
              },
              {
                key: "/dashboard/ielts/reading",
                label: <Link to="/dashboard/ielts/reading">Reading</Link>,
              },
              {
                key: "/dashboard/ielts/writing",
                label: <Link to="/dashboard/ielts/writing">Writing</Link>,
              }
            ],
          },
        ]}
      />
    </Sider>
  );
};

export default Navbar;
