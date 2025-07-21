import React, { useState, useEffect } from "react";
import { Card, Button, Spin, Layout } from "antd";
import {
  FullscreenExitOutlined,
  FullscreenOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { logout } from "../store/authReducer";
import useApiRequest from "../hooks/useApiRequest";
import { redirect, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { enterFullScreen, isFullScreen } from "../utils/documentUtils";
import { logo } from "../assets";

const UserPage = () => {
  const [timeLeft, setTimeLeft] = useState(0);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const { data, loading, error } = useApiRequest(`api/v1/exam/get/${id}`, [id]);

  useEffect(() => {
    if (data?.data && data?.data.leftDuration) {
      setTimeLeft(Math.floor(Number(data.data.leftDuration) / 1000));
    }
  }, [data]);

  useEffect(() => {
    if (data?.data && timeLeft === 0) {
      localStorage.removeItem("exam_start");
      dispatch(logout());
    }
  }, [timeLeft, dispatch]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")} hours ${minutes
      .toString()
      .padStart(2, "0")} minutes ${secs.toString().padStart(2, "0")} seconds`;
  };

  const getDisable = (writing, listening, reading) => {
    return !(writing && reading && listening);
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }
  if (error) {
    localStorage.removeItem("exam_start");
    dispatch(logout());
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontFamily: "Arial, sans-serif",
        position: "relative",
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: 'space-between',
          padding: '0 20px',
          gap: "10px",
        }}
      >
        <img src={logo} alt="Logo" width={100} />
        <div style={{display: 'flex', gap: '10px'}}>
          <Button
            onClick={enterFullScreen}
            icon={
              isFullScreen() ? (
                <FullscreenExitOutlined />
              ) : (
                <FullscreenOutlined />
              )
            }
          ></Button>
          <Button
            danger
            icon={<LogoutOutlined />}
            onClick={() => {
              navigate("/");
            }}
          >
            Exit
          </Button>
        </div>
      </div>
      {error || !data || !data.data ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            fontSize: "18px",
            color: "red",
            textAlign: "center",
          }}
        >
          You have already completed all questions. If you want new questions,
          please contact the instructor.
        </div>
      ) : (
        <div>
          <h2 style={{ marginBottom: "20px", textAlign: "center" }}>
            Time Left: {formatTime(timeLeft)}
          </h2>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              alignItems: "center",
            }}
          >
            {/* Listening Card */}
            {
              <Card title="Listening" style={{ width: 600 }}>
                <p>Practice your listening skills.</p>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <Button
                    type="primary"
                    disabled={data.data.listening}
                    onClick={async () => {
                      try {
                        const stream =
                          await navigator.mediaDevices.getUserMedia({
                            audio: true,
                          });
                        if (stream) {
                          navigate(`/listening/${id}`);
                        }
                      } catch (error) {
                        console.error("Audio permission error: ", error);

                        if (error.name === "NotAllowedError") {
                          toast.info(
                            "Please enable microphone access in your browser settings and try again."
                          );
                        } else {
                          toast.error(
                            "An unexpected error occurred. Please try again."
                          );
                        }
                      }
                    }}
                  >
                    Start
                  </Button>
                </div>
              </Card>
            }
            {/* Reading Card */}
            <Card title="Reading" style={{ width: 600 }}>
              <p>Practice your reading skills.</p>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Button
                  type="primary"
                  disabled={data.data.reading}
                  onClick={() => navigate(`/reading/${id}`)}
                >
                  Start
                </Button>
              </div>
            </Card>
            {/* Writing Card */}
            <Card title="Writing" style={{ width: 600 }}>
              <p>Practice your writing skills.</p>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Button
                  type="primary"
                  disabled={data.data.writing}
                  onClick={() => navigate(`/writing/${id}`)}
                >
                  Start
                </Button>
              </div>
            </Card>
            <Button
              disabled={getDisable(data.data.writing, data.data.listening, data.data.reading)}
              onClick={() => {
                localStorage.removeItem("exam_start");
                dispatch(logout());
              }}
            >
              End Test
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPage;
