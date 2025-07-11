import React, { use, useEffect, useState } from "react";
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
} from "antd";
import { motion } from "framer-motion";
import { CaretRightOutlined } from "@ant-design/icons";
import logo from "../assets/logo.jpeg";
import hero from "../assets/hero.png";
import { FEATURES } from "../data/home"; // Har bir feature icon bilan bo‘lsin: { title, description, icon }
import Navbar from "./components/Navbar";
import PricingSection from "./components/PriceSection";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import LoginModal from "../components/modal/login/LoginModal";
import TestimonialSlider from "./components/TestimonialSlider";

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

const Home = () => {
  const [open, setOpen] = useState(false);
  const { token } = theme.useToken();
  const { user, accessToken, isLoggedIn } = useSelector((state) => state.auth);
  const [refresh, setRefresh] = useState(1);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  const slideIn = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8 } },
  };

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
            <Avatar
              style={{ backgroundColor: color, verticalAlign: "middle" }}
              size="large"
              gap={
                user?.firstname.substring(0, 1) + user?.lastname.substring(0, 1)
              }
            >
              {user}
            </Avatar>
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

      <Content style={{ padding: "80px 40px 40px" }}>
        <div id="home-section" style={{ scrollMarginTop: 100 }}>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            style={{
              padding: "80px 40px",
              borderRadius: 24,
              boxShadow: "0 10px 40px rgba(0,0,0,0.05)",
            }}
          >
            <Row
              gutter={[32, 32]}
              align="middle"
              justify="center"
              style={{ flexDirection: "row", flexWrap: "wrap" }}
            >
              <Col xs={24} md={24} lg={12}>
                <motion.div variants={slideIn}>
                  <Title>
                    <span
                      style={{
                        background:
                          "linear-gradient(to right, #e31837, #ff4081)",
                        WebkitBackgroundClip: "text",
                        color: "transparent",
                      }}
                    >
                      Mock IELTS. AI-Powered.
                    </span>
                    <br />
                    Experience the Real Test Format. <br />
                    Get Instant Scoring & Feedback.
                  </Title>
                  <Paragraph>
                    Train like it’s test day. Our platform mirrors the official
                    IELTS exam structure — with AI-evaluated results to boost
                    your performance faster.
                  </Paragraph>

                  <Button
                    type="default"
                    size="large"
                    shape="round"
                    style={{
                      borderColor: "#e31837",
                      color: "#e31837",
                      fontWeight: "bold",
                      padding: "6px 24px",
                      outline: "none",
                    }}
                    onClick={() => {
                      if (user) {
                        navigate("/start");
                      } else {
                        setOpen(true);
                      }
                    }}
                  >
                    🚀 Start Mock Exam
                  </Button>
                </motion.div>
              </Col>

              {/* Image Section */}
              <Col xs={24} md={24} lg={12} style={{ textAlign: "center" }}>
                <motion.img
                  src={hero}
                  alt="Hero"
                  style={{
                    width: "100%",
                    maxWidth: 450,
                    height: "auto",
                    objectFit: "contain",
                    borderRadius: 24,
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8 }}
                />
              </Col>
            </Row>
          </motion.div>
        </div>

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
            </Col>
          ))}
        </Row>

        {/* Testimonial */}
        <div style={{ textAlign: "center", marginTop: 120 }}>
          <Title level={3} italic style={{ maxWidth: 700, margin: "0 auto" }}>
            “This platform made preparing for IELTS less stressful and I loved
            the instant feedback on my mock exams.”
          </Title>
        </div>

        <Divider style={{ margin: "" }} />

        {/* Call to Action */}
        <TestimonialSlider />

        <div id="faq-section" style={{ marginBottom: 100 }}>
          <Title level={3} style={{ textAlign: "center", marginBottom: 40 }}>
            Frequently Asked Questions
          </Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={24} lg={12}>
              <Collapse
                accordion
                expandIcon={({ isActive }) => (
                  <CaretRightOutlined rotate={isActive ? 90 : 0} />
                )}
                size="large"
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
                size="large"
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
        <Divider style={{ margin: "" }} />

        <PricingSection />
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
