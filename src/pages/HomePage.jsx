import React, { useState } from "react";
import { Button, Col, Row, Typography, theme } from "antd";
import {
  AudioOutlined,
  CheckCircleFilled,
  EditOutlined,
  PlayCircleOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { logout } from "../store/authReducer";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../services/api";
import { enterFullScreen } from "../utils/documentUtils";
import CandidateTopBar from "../components/layouts/CandidateTopBar";

const { Title, Text, Paragraph } = Typography;

const MODULES = [
  {
    key: "listening",
    title: "Listening",
    icon: <AudioOutlined />,
    meta: "4 parts · 40 questions",
    duration: "~30 min",
  },
  {
    key: "reading",
    title: "Reading",
    icon: <ReadOutlined />,
    meta: "3 passages · 40 questions",
    duration: "60 min",
  },
  {
    key: "writing",
    title: "Writing",
    icon: <EditOutlined />,
    meta: "Task 1 · Task 2",
    duration: "60 min",
  },
];

const CHECKLIST = [
  "Sit in a quiet room and put on your headphones — each Listening audio is played only once.",
  "The exam opens in full screen. Do not refresh the page or close the tab.",
  "Modules are taken in order: Listening, then Reading, then Writing.",
  "Your answers are submitted automatically when the time for a module runs out.",
];

const HomePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const { token } = theme.useToken();

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
    } catch {
      toast.error(
        "No new questions have been added yet, please wait for questions to be added."
      );
    } finally {
      setLoading(false);
    }
  };

  const surface = {
    background: token.colorBgContainer,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 16,
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        maxHeight: "100dvh",
        overflow: "hidden",
        background: `
          radial-gradient(900px 420px at 50% -120px, var(--exam-glow), transparent 70%),
          ${token.colorBgLayout}`,
      }}
    >
      <CandidateTopBar
        user={user}
        onExit={() => dispatch(logout())}
      />

      <main
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "clamp(12px, 3vh, 24px) 24px clamp(10px, 2vh, 16px)",
        }}
      >
        <div style={{ width: "100%", maxWidth: 880 }}>
          {/* Hero */}
          <div
            style={{ textAlign: "center", marginBottom: "clamp(10px, 2vh, 18px)" }}
          >
            <Title
              style={{
                margin: 0,
                fontSize: "clamp(21px, 3.6vh, 28px)",
                lineHeight: 1.2,
              }}
            >
              Ready to begin{user?.firstname ? `, ${user.firstname}` : ""}?
            </Title>

            <Paragraph
              type="secondary"
              style={{
                margin: "8px auto 0",
                maxWidth: 560,
                fontSize: 14.5,
              }}
            >
              You are about to take a full computer-delivered IELTS mock test at
              Everest CDI, under real exam conditions. Once you start, the timer
              keeps running.
            </Paragraph>
          </div>

          {/* Module overview */}
          <Row gutter={[14, 14]} style={{ marginBottom: "clamp(10px, 1.8vh, 16px)" }}>
            {MODULES.map((module) => (
              <Col xs={24} sm={8} key={module.key}>
                <div style={{ ...surface, padding: 16, height: "100%" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 36,
                      height: 36,
                      marginBottom: 10,
                      borderRadius: 10,
                      fontSize: 17,
                      color: token.colorPrimary,
                      background: token.colorPrimaryBg,
                    }}
                  >
                    {module.icon}
                  </div>
                  <Text strong style={{ display: "block", fontSize: 16 }}>
                    {module.title}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {module.meta}
                  </Text>
                  <div
                    style={{
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: `1px solid ${token.colorBorderSecondary}`,
                      fontSize: 13,
                      fontWeight: 600,
                      color: token.colorTextSecondary,
                    }}
                  >
                    {module.duration}
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          {/* Checklist + start */}
          <div style={{ ...surface, padding: "20px 22px 24px" }}>
            <Text strong style={{ fontSize: 15 }}>
              Before you start
            </Text>

            {/* Two columns from tablet up: the list is what makes this screen
                tall, and paired rows keep it inside one viewport. */}
            <Row
              gutter={[20, 10]}
              role="list"
              style={{ margin: "12px 0 18px" }}
            >
              {CHECKLIST.map((item) => (
                <Col xs={24} md={12} key={item} role="listitem">
                  <div
                    style={{
                      display: "flex",
                      gap: 9,
                      alignItems: "flex-start",
                    }}
                  >
                    <CheckCircleFilled
                      style={{
                        color: token.colorSuccess,
                        fontSize: 14,
                        marginTop: 3,
                        flex: "0 0 auto",
                      }}
                    />
                    <Text type="secondary" style={{ fontSize: 13.5 }}>
                      {item}
                    </Text>
                  </div>
                </Col>
              ))}
            </Row>

            <div style={{ textAlign: "center" }}>
              <Button
                type="primary"
                size="large"
                loading={loading}
                icon={<PlayCircleOutlined />}
                onClick={handleStartExam}
                style={{
                  height: 48,
                  minWidth: 230,
                  fontSize: 16,
                  fontWeight: 600,
                  borderRadius: 999,
                }}
              >
                Start Exam
              </Button>
              <div style={{ marginTop: 10 }}>
                <Text type="secondary" style={{ fontSize: 12.5 }}>
                  The timer starts as soon as you open a module.
                </Text>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer
        style={{
          flex: "0 0 auto",
          padding: "12px 24px 16px",
          textAlign: "center",
          color: token.colorTextTertiary,
          fontSize: 12.5,
        }}
      >
        Everest CDI Mock © {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default HomePage;
