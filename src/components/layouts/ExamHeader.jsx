import React, { useEffect, useState } from "react";
import { Layout, Button, Modal, Result } from "antd";
import {
  ClockCircleOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  ProfileOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import apiClient from "../../services/api";
import { enterFullScreen, isFullScreen } from "../../utils/documentUtils";
import AnswerReviewModal from "../modal/AnswerReviewModal";

const { Header } = Layout;

const ExamHeader = ({ type, totalExamTimeInSeconds = 0 }) => {
  const { id } = useParams();
  const [timeLeft, setTimeLeft] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const navigate = useNavigate();
  const { answers } = useSelector((state) => state.exam);
  const [loading, setLoading] = useState(false);
  const [isReviewVisible, setIsReviewVisible] = useState(false);

  useEffect(() => {
    if (type === "reading") {
      setTimeLeft(60 * 60);
    } else if (totalExamTimeInSeconds) {
      setTimeLeft(totalExamTimeInSeconds);
    } else {
      setTimeLeft(35 * 60);
    }
  }, [type, totalExamTimeInSeconds]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setIsModalVisible(true);
          handleModalOk();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return (
      <span>
        <span style={{ fontWeight: "bold" }}>
          {minutes > 0
            ? minutes.toString().padStart(2, "0")
            : seconds.toString().padStart(2, "0")}
        </span>{" "}
        {minutes > 0 ? "minutes" : "seconds"} remaining
      </span>
    );
  };

  const handleModalOk = async () => {
    setLoading(true);
    const request = {
      type: type,
      questionAnswers: answers,
    };
    try {
      const response = await apiClient.post(
        `/api/v1/exam/answers/${id}`,
        request
      );
      if (response.code !== 200) {
        toast.error(
          response.message || "Failed to submit answers. Please try again."
        );
        return;
      }
      toast.success("Answers submitted successfully!");
      navigate(`/exam/${id}`);
    } catch (error) {
      console.error("Error submitting answers:", error);
      toast.error("Failed to submit answers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      <Header
        style={{
          textAlign: "center",
          position: "sticky",
          top: 0,
          background: "white",
          boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "20px", fontWeight: 700 }}>
            {type === "reading" ? "Reading Test" : "Listening Test"}
          </span>
          <span
            style={{
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <ClockCircleOutlined style={{ fontSize: "16px" }} />
            {formatTime(timeLeft)}
          </span>
          <div style={{ display: "flex", gap: 15 }}>
            <Button
              onClick={enterFullScreen}
              icon={
                isFullScreen() ? (
                  <FullscreenExitOutlined />
                ) : (
                  <FullscreenOutlined />
                )
              }
            />
            <Button
              icon={<ProfileOutlined />}
              onClick={() => setIsReviewVisible(true)}
            >
              Review
            </Button>
            <Button
              type="primary"
              style={{ fontWeight: "bold" }}
              onClick={() => setIsModalVisible(true)}
            >
              Submit
            </Button>
          </div>
        </div>
      </Header>
      <AnswerReviewModal
        open={isReviewVisible}
        onClose={() => setIsReviewVisible(false)}
      />
      <Modal
        open={isModalVisible}
        closable={timeLeft > 0}
        footer={[
          <Button
            key="submit"
            type="primary"
            onClick={handleModalOk}
            loading={loading}
          >
            Submit
          </Button>,
          <Button
            key="cancel"
            onClick={handleModalCancel}
            disabled={timeLeft <= 0}
          >
            Cancel
          </Button>,
        ]}
        centered
      >
        <Result
          title="Are you sure you want to submit?"
          // extra={
          //   <Button type="primary" key="console">
          //     Go Console
          //   </Button>
          // }
        />
      </Modal>
    </>
  );
};

export default ExamHeader;
