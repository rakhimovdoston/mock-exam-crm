import { Space, Drawer, Button, Grid } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";

const { useBreakpoint } = Grid;

const activeColor = "#e31837";
const defaultColor = "#333";

const SECTIONS = [
  { id: "home-section", label: "Home" },
  { id: "pricing-section", label: "Pricing" },
  { id: "faq-section", label: "FAQs" },
];

const Navbar = () => {
  const screens = useBreakpoint();
  const [activeSection, setActiveSection] = useState("home-section");
  const [drawerVisible, setDrawerVisible] = useState(false);

  const handleScrollTo = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveSection(id);
      window.history.pushState(null, "", `#${id}`);
      setDrawerVisible(false); // Close drawer after click (mobile)
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight / 3;
      for (const section of SECTIONS) {
        const elem = document.getElementById(section.id);
        if (elem) {
          const top = elem.offsetTop;
          const bottom = top + elem.offsetHeight;
          if (scrollPos >= top && scrollPos < bottom) {
            setActiveSection(section.id);
            window.history.replaceState(null, "", `#${section.id}`);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const renderLinks = () =>
    SECTIONS.map(({ id, label }) => (
      <a
        key={id}
        href={`#${id}`}
        onClick={(e) => handleScrollTo(e, id)}
        style={{
          color: activeSection === id ? activeColor : defaultColor,
          textDecoration: "none",
          borderBottom:
            activeSection === id ? `2px solid ${activeColor}` : "none",
          paddingBottom: 4,
          fontWeight: 600,
          fontSize: 16,
          display: "block",
          marginBottom: screens.xs ? 16 : 0,
          cursor: "pointer",
          transition: "color 0.3s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = activeColor)}
        onMouseLeave={(e) =>
          (e.currentTarget.style.color =
            activeSection === id ? activeColor : defaultColor)
        }
      >
        {label}
      </a>
    ));

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >

      {screens.md ? (
        <Space size="large">{renderLinks()}</Space>
      ) : (
        <>
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setDrawerVisible(true)}
          />
          <Drawer
            title="Navigation"
            placement="right"
            onClose={() => setDrawerVisible(false)}
            open={drawerVisible}
          >
            {renderLinks()}
          </Drawer>
        </>
      )}
    </div>
  );
};

export default Navbar;
