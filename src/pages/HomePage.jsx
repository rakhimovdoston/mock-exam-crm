import React, { useState } from "react";
import { Button, Layout, Typography } from "antd";
import { LogoutOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { logout } from "../store/authReducer";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../services/api";
import { enterFullScreen } from "../utils/documentUtils";
import { logo } from "../assets";

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

const HomePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState();

  const handleStartExam = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("api/v1/exam/start");
      if (response.code !== 200) {
        toast.error(
          "No new questions have been added yet, please wait for questions to be added."
        );
        return;
      }
      enterFullScreen();
      navigate(`/exam/${response.data.name}`);
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
        <img src={logo} alt="Logo" width={50} />
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
        >
          Start Exam
        </Button>
      </Content>
      <Footer style={{ textAlign: "center" }}>Mock Exam ©2025</Footer>
    </Layout>
  );
};

export default HomePage;
