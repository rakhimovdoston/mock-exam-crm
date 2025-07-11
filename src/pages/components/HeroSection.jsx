import React from "react";
import { motion } from "framer-motion";
import { Button, Col, Row, Typography } from "antd";
import hero from "../../assets/hero.png"; // Ensure this path is correct
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const { Title, Paragraph } = Typography;

const HeroSection = ({ setOpen }) => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  const slideIn = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8 } },
  };
  return (
    <div id="home-section">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        style={{
          padding: "80px 40px",
          borderRadius: 24,
          position: "relative",
          zIndex: 2,
        }}
      >
        <Row
          gutter={[32, 32]}
          align="middle"
          justify="center"
          style={{ flexDirection: "row", flexWrap: "wrap" }}
        >
          <Col
            xs={24}
            md={24}
            lg={12}
            style={{ position: "relative", zIndex: 10 }}
          >
            <motion.div variants={slideIn}>
              <Title>
                <span
                  style={{
                    background: "linear-gradient(to right, #e31837, #ff4081)",
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
                IELTS exam structure — with AI-evaluated results to boost your
                performance faster.
              </Paragraph>

              <Button
                type="default"
                variant="filled"
                size="large"
                shape="round"
                style={{
                  backgroundColor: "",
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
                🎯 Demo Test (Free)
              </Button>
            </motion.div>
          </Col>

          <Col
            xs={24}
            md={24}
            lg={12}
            style={{ textAlign: "center", position: "relative", zIndex: 3 }}
          >
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
  );
};

export default HeroSection;
