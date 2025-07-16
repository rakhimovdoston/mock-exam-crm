import React, { useEffect, useState } from "react";
import { Card, Button, Row, Col, Typography, Tooltip, Badge } from "antd";
import {
  LogoutOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  AudioOutlined,
  BookOutlined,
  EditOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../store/authReducer";
import { enterFullScreen, isFullScreen } from "../utils/documentUtils";
import useApiRequest from "../hooks/useApiRequest";
import { toast } from "react-toastify";

const { Title, Text } = Typography;

const SectionCard = ({ icon, title, desc, onClick, disabled }) => (
  <Card
    hoverable
    style={{
      width: 320,
      borderRadius: "16px",
      background: "linear-gradient(to bottom right, #ffffff, #f0f5ff)",
      boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
    }}
    bodyStyle={{ textAlign: "center", padding: "24px" }}
  >
    <div style={{ fontSize: 36, color: "#1890ff", marginBottom: 12 }}>
      {icon}
    </div>
    <Title level={4}>{title}</Title>
    <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
      {desc}
    </Text>
    <Button
      type="primary"
      size="large"
      block
      disabled={disabled}
      onClick={onClick}
    >
      Start {title}
    </Button>
  </Card>
);

const UserPage = () => {
  const [timeLeft, setTimeLeft] = useState(0);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();

  const { data, loading, error } = useApiRequest(`api/v1/exam/get/${id}`, [id]);

  useEffect(() => {
    if (data?.data?.leftDuration) {
      setTimeLeft(Math.floor(Number(data.data.leftDuration) / 1000));
    }
  }, [data]);

  useEffect(() => {
    if (timeLeft === 0 && data?.data) {
      localStorage.removeItem("exam_start");
      dispatch(logout());
    }
  }, [timeLeft]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}h ${m
      .toString()
      .padStart(2, "0")}m ${sec.toString().padStart(2, "0")}s`;
  };

  const handleAudioAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (stream) navigate(`/listening/${data.data.id}`);
    } catch (err) {
      if (err.name === "NotAllowedError") {
        toast.info("Please enable microphone access in your browser settings.");
      } else {
        toast.error("Microphone access failed.");
      }
    }
  };

  if (error) {
    localStorage.removeItem("exam_start");
    dispatch(logout());
  }

  return (
    <div
      style={{
        padding: 20,
        height: "100vh",
        background: "#f5f6fa",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          height: "100%",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            display: "flex",
            gap: 12,
          }}
        >
          <Tooltip title="Fullscreen">
            <Button
              shape="circle"
              icon={
                isFullScreen() ? (
                  <FullscreenExitOutlined />
                ) : (
                  <FullscreenOutlined />
                )
              }
              onClick={enterFullScreen}
            />
          </Tooltip>
          <Tooltip title="Exit">
            <Button
              shape="round"
              icon={<LogoutOutlined />}
              danger
              onClick={() => {
                localStorage.removeItem("exam_start");
                navigate("/");
              }}
            >
              Exit
            </Button>
          </Tooltip>
        </div>

        {/* Timer */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Title level={3}>
            <ClockCircleOutlined style={{ marginRight: 8 }} />
            Time Left: {formatTime(timeLeft)}
          </Title>
        </div>

        {/* Section Cards */}
        <Row gutter={[24, 24]} justify="center">
          <Col>
            <SectionCard
              title="Listening"
              desc="Practice your listening skills."
              icon={<AudioOutlined />}
              disabled={data?.data?.listening}
              onClick={handleAudioAccess}
            />
          </Col>
          <Col>
            <SectionCard
              title="Reading"
              desc="Test your reading comprehension."
              icon={<BookOutlined />}
              disabled={data?.data?.reading || !data?.data?.listening}
              onClick={() => navigate(`/reading/${data.data.id}`)}
            />
          </Col>
          <Col>
            <SectionCard
              title="Writing"
              desc="Demonstrate your writing skills."
              icon={<EditOutlined />}
              disabled={data?.data?.writing || !data?.data?.reading}
              onClick={() => navigate(`/writing/${data.data.id}`)}
            />
          </Col>
        </Row>

        {/* End Test */}
        <div style={{ marginTop: 40, textAlign: "center" }}>
          <Button
            type="default"
            danger
            disabled={
              !data?.data?.listening &&
              !data?.data?.reading &&
              !data?.data?.writing
            }
            onClick={() => {
              dispatch(logout());
            }}
          >
            End Test
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserPage;
