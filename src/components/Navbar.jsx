import React, { useState } from "react";
import { Layout, Menu } from "antd";
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
  CalendarOutlined,
  TabletOutlined,
  FieldTimeOutlined,
  WarningOutlined,
  RedoOutlined,
} from "@ant-design/icons";
import logo from "../assets/logo.png";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useT } from "../i18n/useT";

const { Sider } = Layout;

const MATERIALS_KEY = "/dashboard/ielts";

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const t = useT();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">{t("nav.dashboard")}</Link>,
      roles: ["ROLE_ADMIN", "ROLE_BRANCH_ADMIN", "ROLE_SPEAKER"],
    },
    {
      key: "/dashboard/employees",
      icon: <TeamOutlined />,
      label: <Link to="/dashboard/employees">{t("nav.team")}</Link>,
      roles: ["ROLE_ADMIN"],
    },
    {
      key: "/dashboard/users",
      icon: <UserOutlined />,
      label: <Link to="/dashboard/users">{t("nav.candidates")}</Link>,
      roles: ["ROLE_ADMIN", "ROLE_BRANCH_ADMIN"],
    },
    // {
    //   key: "/dashboard/attention",
    //   icon: <WarningOutlined />,
    //   label: <Link to="/dashboard/attention">{t("nav.attention")}</Link>,
    //   roles: ["ROLE_ADMIN", "ROLE_BRANCH_ADMIN"],
    // },
    {
      key: "/dashboard/contest",
      icon: <TrophyOutlined />,
      label: <Link to="/dashboard/contest">{t("nav.testSessions")}</Link>,
      roles: ["ROLE_BRANCH_ADMIN", "ROLE_ADMIN"],
    },
    {
      key: "/dashboard/speaking",
      icon: <CustomerServiceOutlined />,
      label: <Link to="/dashboard/speaking">{t("nav.speakingSessions")}</Link>,
      roles: ["ROLE_SPEAKER", "ROLE_ADMIN", "ROLE_BRANCH_ADMIN"],
    },
    {
      key: "/dashboard/extra-time",
      icon: <FieldTimeOutlined />,
      label: <Link to="/dashboard/extra-time">{t("nav.extraTime")}</Link>,
      roles: ["ROLE_ADMIN", "ROLE_BRANCH_ADMIN"],
    },
    {
      key: "/dashboard/section-reopen",
      icon: <RedoOutlined />,
      label: (
        <Link to="/dashboard/section-reopen">{t("nav.sectionReopen")}</Link>
      ),
      roles: ["ROLE_ADMIN", "ROLE_BRANCH_ADMIN"],
    },
    {
      key: "/dashboard/venues",
      icon: <EnvironmentOutlined />,
      label: <Link to="/dashboard/venues">{t("nav.venues")}</Link>,
      roles: ["ROLE_ADMIN"],
    },
    {
      key: MATERIALS_KEY,
      icon: <BookOutlined />,
      label: t("nav.materials"),
      roles: ["ROLE_ADMIN"],
      children: [
        {
          key: "/dashboard/ielts/listening",
          icon: <SoundOutlined />,
          label: (
            <Link to="/dashboard/ielts/listening">{t("nav.listening")}</Link>
          ),
        },
        {
          key: "/dashboard/ielts/reading",
          icon: <ReadOutlined />,
          label: <Link to="/dashboard/ielts/reading">{t("nav.reading")}</Link>,
        },
        {
          key: "/dashboard/ielts/writing",
          icon: <EditOutlined />,
          label: <Link to="/dashboard/ielts/writing">{t("nav.writing")}</Link>,
        },
      ],
    },
    {
      key: "/dashboard/results",
      icon: <FileDoneOutlined />,
      label: <Link to="/dashboard/results">{t("nav.results")}</Link>,
      roles: ["ROLE_ADMIN", "ROLE_BRANCH_ADMIN"],
    },
    {
      key: "/dashboard/test-dates",
      icon: <CalendarOutlined />,
      label: <Link to="/dashboard/test-dates">{t("nav.testDates")}</Link>,
      roles: ["ROLE_ADMIN", "ROLE_BRANCH_ADMIN"],
    },
    {
      key: "/dashboard/devices",
      icon: <TabletOutlined />,
      label: <Link to="/dashboard/devices">{t("nav.devices")}</Link>,
      roles: ["ROLE_ADMIN", "ROLE_BRANCH_ADMIN"],
    },
  ];

  const filterByRole = (items, role = "") => {
    if (role === "") return items;
    return items.filter((item) => item.roles?.includes(role));
  };

  const filteredItems = filterByRole(menuItems, user?.roles[0]);

  // Highlight the deepest menu entry whose path prefixes the current URL, so
  // detail pages (/dashboard/user/12) keep their parent section active.
  const allKeys = filteredItems.flatMap((item) =>
    item.children ? item.children.map((child) => child.key) : [item.key]
  );
  const selectedKey = allKeys
    .filter(
      (key) =>
        location.pathname === key || location.pathname.startsWith(`${key}/`)
    )
    .sort((a, b) => b.length - a.length)[0];

  const isMaterials = location.pathname.startsWith(MATERIALS_KEY);

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      width={232}
      style={{ height: "100vh", position: "sticky", top: 0, left: 0 }}
    >
      <div
        className="logo"
        style={{
          display: "flex",
          justifyContent: "center",
          padding: collapsed ? "16px 8px" : "20px 16px",
          transition: "padding 0.2s ease",
        }}
      >
        <Link
          to="/dashboard"
          style={{
            display: "block",
            // background: "#ffffff",
            borderRadius: 12,
            padding: collapsed ? "6px 4px" : "10px 14px",
            lineHeight: 0,
            width: "100%",
          }}
        >
          <img
            src={logo}
            alt="Everest Mock Exam"
            style={{ width: "100%", display: "block" }}
          />
        </Link>
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={selectedKey ? [selectedKey] : []}
        defaultOpenKeys={isMaterials ? [MATERIALS_KEY] : []}
        items={filteredItems}
        style={{ borderInlineEnd: "none" }}
      />
    </Sider>
  );
};

export default Navbar;
