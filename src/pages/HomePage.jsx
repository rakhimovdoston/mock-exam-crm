import React, { useState } from "react";
import { Button, Layout, Typography } from "antd";
import { LogoutOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { logout } from "../store/authReducer";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../services/api";
import { enterFullScreen } from "../utils/documentUtils";

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

const HomePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState();

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
        toast.error(
          "No new questions have been added yet, please wait for questions to be added."
        );
        return;
      }
      localStorage.setItem("exam_start", response.data.id);
      navigate(`/exam`);
    } catch (error) {
      toast.error(
        "No new questions have been added yet, please wait for questions to be added."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #646cff",
        }}
      >
        <Title level={3} style={{ color: "white", margin: 0 }}>
          Welcome, {user?.firstname} {user?.lastname}
        </Title>
        <Button
          type="primary"
          danger
          icon={<LogoutOutlined />}
          onClick={() => {
            dispatch(logout());
          }}
        >
          Exit
        </Button>
      </Header>
      <Content
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <Title level={2} style={{ color: "#646cff" }}>
          Ready to Start Your Exam?
        </Title>
        <Button
          type="primary"
          size="large"
          icon={<PlayCircleOutlined />}
          onClick={handleStartExam}
          onMouseEnter={(e) => {
            e.target.style.transform = "scale(1.05)";
            e.target.style.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "scale(1)";
            e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
          }}
        >
          Start Exam
        </Button>
      </Content>
      <Footer style={{ textAlign: "center" }}>Mock Exam ©2025</Footer>
    </Layout>
  );
};

export default HomePage;
