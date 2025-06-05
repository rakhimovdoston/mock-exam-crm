import React, { useState, useEffect } from "react";
import { Card, Button, Spin } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { logout } from "../store/authReducer";
import useApiRequest from "../hooks/useApiRequest";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const UserPage = () => {
  const [timeLeft, setTimeLeft] = useState(0);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data, loading, error } = useApiRequest("api/v1/exam/get", []);

  useEffect(() => {
    if (data?.data && data?.data.leftDuration) {
      setTimeLeft(Math.floor(Number(data.data.leftDuration) / 1000)); // Set timeLeft from API response
    }
  }, [data]);

  useEffect(() => {
    if (data?.data && timeLeft === 0) {
      dispatch(logout());
    }
  }, [timeLeft, dispatch]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => clearInterval(timer); // Cleanup timer on component unmount
  }, []);

  // Format time in HH:MM:SS
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")} hours ${minutes
      .toString()
      .padStart(2, "0")} minutes ${secs.toString().padStart(2, "0")} seconds`;
  };

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
      <Button
        danger
        icon={<LogoutOutlined />}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
        }}
        onClick={() => {
          dispatch(logout());
        }}
      >
        Exit
      </Button>
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
                        await navigator.mediaDevices.getUserMedia({audio: true});
                        navigate(`/listening/${data.data.id}`)
                      } catch(error) {
                        console.log("Audio permission error: ", error)
                        toast.error("Please allow me to listen to the audio.");
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
                  onClick={() => navigate(`/reading/${data.data.id}`)}
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
                  onClick={() => navigate(`/writing/${data.data.id}`)}
                >
                  Start
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPage;
