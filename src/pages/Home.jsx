import React, { useEffect, useState } from "react";
import {
  Layout,
  Button,
  Typography,
  Row,
  Col,
  Card,
  Divider,
  Collapse,
  theme,
  Avatar,
  Image,
  Form,
  Input,
  Menu,
  Dropdown,
} from "antd";
import { motion } from "framer-motion";
import {
  CaretRightOutlined,
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import logo from "../assets/logo.jpeg";
import { listening, reading, writing, started } from "../assets";
import { FEATURES } from "../data/home"; // Har bir feature icon bilan bo‘lsin: { title, description, icon }
import Navbar from "./components/Navbar";
import PricingSection from "./components/PriceSection";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import LoginModal from "../components/modal/login/LoginModal";
import TestimonialSlider from "./components/TestimonialSlider";
import HeroSection from "./components/HeroSection";
import ScrollFadeIn from "../components/ScrollFadeIn";
import { fetchProfile, logout } from "../store/authReducer";

const { Header, Content, Footer } = Layout;
const { Title, Paragraph } = Typography;

const faqs = [
  {
    key: "1",
    label: "What is a Mock IELTS exam?",
    children: (
      <p>
        A Mock IELTS exam replicates the real IELTS test format, including
        timing and question types, to help you prepare under real conditions.
      </p>
    ),
  },
  {
    key: "2",
    label: "How are the mock exams evaluated?",
    children: (
      <p>
        Our smart scoring system instantly evaluates your answers and gives you
        a band score — just like the actual IELTS grading system.
      </p>
    ),
  },
  {
    key: "3",
    label: "Can I check my answers afterward?",
    children: (
      <p>
        Yes, after completing a mock test, you’ll receive a breakdown of your
        performance — with correct answers and expert feedback.
      </p>
    ),
  },
  {
    key: "4",
    label: "Is the platform free to use?",
    children: (
      <p>
        Absolutely! Your first full-length mock exam is free. You can unlock
        more features by upgrading to Premium.
      </p>
    ),
  },
  {
    key: "5",
    label: "Do you offer Speaking and Writing mock tests?",
    children: (
      <p>
        Yes! You can practice the full IELTS Speaking and Writing modules, and
        get AI-estimated band scores with tips to improve.
      </p>
    ),
  },
  {
    key: "6",
    label: "Can teachers track student progress?",
    children: (
      <p>
        Definitely. Teachers get access to a smart dashboard where they can
        assign tests, monitor scores, and review student performance.
      </p>
    ),
  },
];

const HOW_IT_WORKS_ITEMS = [
  // {
  //   title: "Video Tutorial",
  //   description: "Watch a tutorial on how to take an IELTS mock test on Examy.",
  //   media: "https://img.youtube.com/vi/YOUR_VIDEO_ID/0.jpg",
  // },
  // {
  //   title: "Detailed report",
  //   description:
  //     "Receive a comprehensive report with your scores and areas for improvement.",
  //   media: started, // local image path
  // },
  {
    title: "Listening section",
    description: "Listen to a recording and answer questions based on it.",
    media: listening,
  },
  {
    title: "Writing section",
    description: "Write two essays based on the given topics.",
    media: writing,
  },
  {
    title: "Reading section",
    description: "Read three passages and answer related questions.",
    media: reading,
  },
  // {
  //   title: "Speaking section",
  //   description: "Answer questions orally during a simulated speaking test.",
  //   media: "/images/speaking.png",
  // },
];

const Home = () => {
  const [open, setOpen] = useState(false);
  const { token } = theme.useToken();
  const { user, accessToken, isLoggedIn } = useSelector((state) => state.auth);
  const [refresh, setRefresh] = useState(1);
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const userMenu = (
    <Menu>
      <Menu.Item
        key="profile"
        icon={<UserOutlined />}
        onClick={() => navigate("/profile")}
      >
        Profile
      </Menu.Item>
      <Menu.Item
        key="settings"
        icon={<SettingOutlined />}
        onClick={() => navigate("/settings")}
      >
        Settings
      </Menu.Item>
      <Menu.Item
        key="logout"
        icon={<LogoutOutlined />}
        onClick={() => {
          dispatch(logout());
        }}
      >
        Logout
      </Menu.Item>
    </Menu>
  );

  const cardAnimation = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
  };
  useEffect(() => {
    if (isLoggedIn && accessToken) {
      dispatch(fetchProfile());
    }
  }, [refresh, isLoggedIn, accessToken]);

  return (
    <Layout style={{ minHeight: "100vh", background: "#fff" }}>
      <Header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#fff",
          padding: "40px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <Link to={"/"} style={{ display: "flex", alignItems: "center" }}>
          <img src={logo} alt="Logo" width={100} />
        </Link>
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          <Navbar />
          {user ? (
            <Dropdown
              overlay={userMenu}
              placement="bottomRight"
              trigger={["click"]}
            >
              <Avatar
                style={{
                  verticalAlign: "middle",
                  cursor: "pointer",
                  backgroundColor: "#e31837",
                }}
                size="large"
              >
                {/* {user} */}
                {user?.firstname.substring(0, 1) +
                  "." +
                  user?.lastname.substring(0, 1)}
              </Avatar>
            </Dropdown>
          ) : (
            <Button
              type="default"
              shape="round"
              onClick={() => setOpen(true)}
              style={{
                borderColor: "#e31837",
                color: "#e31837",
                fontWeight: "bold",
                padding: "6px 24px",
                outline: "none",
              }}
            >
              Login
            </Button>
          )}
        </div>
      </Header>
      <LoginModal open={open} setOpen={setOpen} setRefresh={setRefresh} />
      <Content>
        <div
          style={{
            position: "relative",
            scrollMarginTop: 100,
            overflow: "hidden",
          }}
        >
          <svg
            viewBox="0 0 1440 320"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 1,
              pointerEvents: "none",
            }}
            preserveAspectRatio="none"
          >
            {[...Array(5)].map((_, i) => (
              <path
                key={i}
                d={`
        M0,${60 + i * 40}
        C240,${400 + i * 60},
        1200,${-40 + i * 60},
        1440,${60 + i * 40}
      `}
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="1.5"
                opacity="0.35"
              />
            ))}

            <defs>
              <linearGradient
                id="lineGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#e31837" />
                <stop offset="100%" stopColor="#ff4081" />
              </linearGradient>
            </defs>
          </svg>

          <HeroSection setOpen={setOpen} />
        </div>

        <ScrollFadeIn>
          <div style={{ marginTop: 100, padding: "0 24px" }}>
            <Title level={2} style={{ textAlign: "left", marginBottom: 40 }}>
              How does this actually work?
            </Title>

            <Row gutter={[24, 24]} justify="center">
              {HOW_IT_WORKS_ITEMS.map((item, index) => (
                <Col key={index} xs={24} sm={12} md={8}>
                  <Card
                    hoverable
                    style={{
                      borderRadius: 12,
                      overflow: "hidden",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
                      height: "100%",
                    }}
                  >
                    <Image
                      src={item.media}
                      alt={item.title}
                      preview={true}
                      style={{
                        width: "100%",
                        objectFit: "contain",
                        borderRadius: 8,
                      }}
                    />
                    <div style={{ paddingTop: 16 }}>
                      <strong style={{ fontSize: 16 }}>{item.title}</strong>
                      <p style={{ margin: 0, color: "#555" }}>
                        {item.description}
                      </p>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </ScrollFadeIn>

        {/* Features Section */}
        <Row gutter={[24, 24]} justify="center" style={{ marginTop: 100 }}>
          {FEATURES.map((feature, index) => (
            <Col
              key={index}
              xs={24}
              sm={12}
              md={12}
              lg={8}
              xl={8}
              style={{ display: "flex", justifyContent: "center" }}
            >
              <ScrollFadeIn delay={index * 0.2}>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={cardAnimation}
                  whileHover={{ scale: 1.05 }}
                  style={{ width: "100%", maxWidth: 400 }}
                >
                  <Card
                    hoverable
                    style={{
                      textAlign: "center",
                      borderRadius: 16,
                      padding: 24,
                      backdropFilter: "blur(8px)",
                      background: "rgba(255, 255, 255, 0.75)",
                      boxShadow: "0 4px 30px rgba(0, 0, 0, 0.05)",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <img
                      src={feature.icon}
                      alt={feature.title}
                      width={280}
                      style={{ marginBottom: 20, objectFit: "contain" }}
                    />
                    <Title level={4} style={{ color: "#e31837" }}>
                      {feature.title}
                    </Title>
                    <Paragraph style={{ color: "#666" }}>
                      {feature.description}
                    </Paragraph>
                  </Card>
                </motion.div>
              </ScrollFadeIn>
            </Col>
          ))}
        </Row>

        {/* Testimonial */}
        <ScrollFadeIn>
          <div style={{ textAlign: "center", marginTop: 120 }}>
            <Title level={3} italic style={{ maxWidth: 700, margin: "0 auto" }}>
              “This platform made preparing for IELTS less stressful and I loved
              the instant feedback on my mock exams.”
            </Title>
          </div>
        </ScrollFadeIn>

        <Divider style={{ margin: "" }} />

        {/* Call to Action */}
        <TestimonialSlider />
        <Divider style={{ marginTop: "40px" }} />

        <ScrollFadeIn>
          <PricingSection />
        </ScrollFadeIn>

        <ScrollFadeIn>
          <div id="faq-section" style={{ marginBottom: 100 }}>
            <Title level={3} style={{ textAlign: "center", marginBottom: 40 }}>
              Frequently Asked Questions
            </Title>
            <Row gutter={[16, 16]} style={{ padding: "24px" }}>
              <Col xs={24} md={24} lg={12}>
                <Collapse
                  accordion
                  expandIcon={({ isActive }) => (
                    <CaretRightOutlined rotate={isActive ? 90 : 0} />
                  )}
                  size="middle"
                  style={{
                    background: token.colorBgContainer,
                    borderRadius: 12,
                  }}
                  items={faqs.slice(0, 3).map((faq) => ({
                    ...faq,
                    label: `❓ ${faq.label}`,
                  }))}
                />
              </Col>
              <Col xs={24} md={24} lg={12}>
                <Collapse
                  accordion
                  expandIcon={({ isActive }) => (
                    <CaretRightOutlined rotate={isActive ? 90 : 0} />
                  )}
                  size="middle"
                  style={{
                    background: token.colorBgContainer,
                    borderRadius: 12,
                  }}
                  items={faqs.slice(3, 6).map((faq) => ({
                    ...faq,
                    label: `❓ ${faq.label}`,
                  }))}
                />
              </Col>
            </Row>
          </div>
        </ScrollFadeIn>

        <ScrollFadeIn>
          <div
            style={{
              background: "#fafafa",
              padding: "24px",
            }}
          >
            <Title level={3} style={{ textAlign: "center", marginBottom: 40 }}>
              Contact Us
            </Title>

            <Row justify="center">
              <Col xs={24} sm={20} md={16} lg={12}>
                <Card style={{ borderRadius: 16 }}>
                  <Form
                    layout="vertical"
                    onFinish={(values) => {
                      console.log("Contact form submitted:", values);
                      alert("Thank you for reaching out!");
                    }}
                  >
                    <Form.Item
                      label="Your Name"
                      name="name"
                      rules={[
                        { required: true, message: "Please enter your name" },
                      ]}
                    >
                      <Input placeholder="John Doe" />
                    </Form.Item>

                    <Form.Item
                      label="Email Address"
                      name="email"
                      rules={[
                        { required: true, message: "Please enter your email" },
                        { type: "email", message: "Invalid email format" },
                      ]}
                    >
                      <Input placeholder="you@example.com" />
                    </Form.Item>

                    <Form.Item
                      label="Message"
                      name="message"
                      rules={[
                        {
                          required: true,
                          message: "Please enter your message",
                        },
                      ]}
                    >
                      <Input.TextArea
                        rows={4}
                        placeholder="Write your message here..."
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button type="primary" htmlType="submit" block>
                        Send Message
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
            </Row>
          </div>
        </ScrollFadeIn>
      </Content>

      {/* Footer */}
      <Footer
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 40px",
          background: "#fff",
          borderTop: "1px solid #eee",
        }}
      >
        <img src={logo} width={100} alt="Logo" />
        <span style={{ color: "#888" }}>
          © 2025 Mock IELTS. All rights reserved.
        </span>
      </Footer>
    </Layout>
  );
};

export default Home;
