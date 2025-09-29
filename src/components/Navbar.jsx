import React, { useState } from "react";
import { Image, Layout, Menu } from "antd";
import {
  UserOutlined,
  TeamOutlined,
  TrophyOutlined,
  DashboardOutlined,
  CustomerServiceOutlined,
  EnvironmentOutlined,
  BookOutlined,
  SoundOutlined,
  ReadOutlined,
  EditOutlined,
  FileDoneOutlined,
} from "@ant-design/icons";
import logo from "../assets/logo.jpeg";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

const { Sider } = Layout;

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);

  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">Dashboard</Link>,
      roles: ["ROLE_ADMIN", "ROLE_BRANCH_ADMIN", "ROLE_SPEAKER"],
    },
    {
      key: "/dashboard/employees",
      icon: <TeamOutlined />,
      label: <Link to="/dashboard/employees">Team</Link>,
      roles: ["ROLE_ADMIN"],
    },
    {
      key: "/dashboard/users",
      icon: <UserOutlined />,
      label: <Link to="/dashboard/users">Candidates</Link>,
      roles: ["ROLE_ADMIN", "ROLE_BRANCH_ADMIN"],
    },
    {
      key: "/dashboard/contest",
      icon: <TrophyOutlined />,
      label: <Link to="/dashboard/contest">Test Sessions</Link>,
      roles: ["ROLE_BRANCH_ADMIN", "ROLE_ADMIN"],
    },
    {
      key: "/dashboard/speaking",
      icon: <CustomerServiceOutlined />,
      label: <Link to="/dashboard/speaking">Speaking Sessions</Link>,
      roles: ["ROLE_SPEAKER", "ROLE_ADMIN", "ROLE_BRANCH_ADMIN"],
    },
    {
      key: "/dashboard/branches",
      icon: <EnvironmentOutlined />,
      label: <Link to="/dashboard/venues">Venues</Link>,
      roles: ["ROLE_ADMIN"],
    },
    {
      key: "/dashboard/ielts",
      icon: <BookOutlined />,
      label: "IELTS Materials",
      roles: ["ROLE_ADMIN"],
      children: [
        {
          key: "/dashboard/ielts/listening",
          icon: <SoundOutlined />,
          label: <Link to="/dashboard/ielts/listening">Listening</Link>,
        },
        {
          key: "/dashboard/ielts/reading",
          icon: <ReadOutlined />,
          label: <Link to="/dashboard/ielts/reading">Reading</Link>,
        },
        {
          key: "/dashboard/ielts/writing",
          icon: <EditOutlined />,
          label: <Link to="/dashboard/ielts/writing">Writing</Link>,
        },
      ],
    },
    {
      key: "/dashboard/results",
      icon: <FileDoneOutlined />,
      label: <Link to="/dashboard/results">Results</Link>,
      roles: ["ROLE_ADMIN", "ROLE_BRANCH_ADMIN"],
    },
  ];

  const filterByRole = (items, role = "") => {
    if (role === "") return items;
    return items.filter((item) => item.roles?.includes(role));
  };

  const filteredItems = filterByRole(menuItems, user?.roles[0]);

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
        items={filteredItems}
      />
    </Sider>
  );
};

export default Navbar;
