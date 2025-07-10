import React, { useState } from "react";
import { Button, Layout, Typography, Card } from "antd";
import { LogoutOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { logout } from "../store/authReducer";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../services/api";
import { enterFullScreen } from "../utils/documentUtils";

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const HomePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);

  const handleStartExam = async () => {
    enterFullScreen();
    if (localStorage.getItem("exam_start")) {
      navigate("exam");
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.get("api/v1/exam/start");
      if (response.code !== 200) {
        toast.error("No new questions are available. Please wait.");
        return;
      }
      localStorage.setItem("exam_start", response.data.id);
      navigate(`/exam`);
    } catch (error) {
      toast.error("Unable to start the exam. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout
      style={{
        minHeight: "100vh",
        background:
          "url('https://images.unsplash.com/photo-1581090700227-1e8c9672717d') center/cover no-repeat",
        backdropFilter: "blur(5px)",
      }}
    >
      <Header
        style={{
          background: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(10px)",
          display: "flex",
          justifyContent: "flex-end",
          padding: "20px 40px",
          borderBottom: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        <Button
          icon={<LogoutOutlined />}
          danger
          type="primary"
          onClick={() => dispatch(logout())}
        >
          Exit
        </Button>
      </Header>

      <Content
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px",
          flex: 1,
        }}
      >
        <Card
          style={{
            width: "100%",
            maxWidth: "500px",
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            borderRadius: "16px",
            padding: "40px 30px",
            backdropFilter: "blur(12px)",
            textAlign: "center",
            color: "#fff",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
          }}
          bordered={false}
        >
          <Title level={3} style={{marginBottom: "10px" }}>
            Hi "{user?.firstname}" 👋
          </Title>
          <Text style={{ fontSize: "16px" }}>
            Your IELTS Mock Exam is ready!
          </Text>
          <br />
          <br />
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            size="large"
            loading={loading}
            onClick={handleStartExam}
            style={{
              backgroundColor: "#10b981",
              border: "none",
              fontWeight: "bold",
              padding: "12px 30px",
              fontSize: "16px",
              borderRadius: "10px",
              transition: "all 0.3s ease-in-out",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "scale(1.05)";
              e.target.style.backgroundColor = "#059669";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
              e.target.style.backgroundColor = "#10b981";
            }}
          >
            Start Exam
          </Button>
        </Card>
      </Content>

      <Footer
        style={{
          textAlign: "center",
          color: "#ddd",
          background: "transparent",
          borderTop: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        IELTS Mock Platform ©2025
      </Footer>
    </Layout>
  );
};

export default HomePage;
