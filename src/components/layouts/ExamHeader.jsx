import React, { useEffect, useRef, useState, useCallback } from "react";
import { Layout, Button, Modal, Result, Dropdown, Flex, Select } from "antd";
import {
  ClockCircleOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  ProfileOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import apiClient from "../../services/api";
import { enterFullScreen, isFullScreen } from "../../utils/documentUtils";
import AnswerReviewModal from "../modal/AnswerReviewModal";
import { logo } from "../../assets";
import store from "../../store";
import { changeSize } from "../../store/appReducer";
import { clearExamAnswers } from "../../store/examReducer";

const { Header } = Layout;

const ExamHeader = ({
  type,
  totalExamTimeInSeconds = 0,
  isTimerReady = false,
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const previousTotalRef = useRef(null);

  // ✅ Updated: More specific storage key
  const STORAGE_KEY = `exam_timer_${type}_${id}`;

  // Load saved state from sessionStorage
  const getSavedState = () => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Error loading saved state:", error);
      return null;
    }
  };

  const savedState = getSavedState();

  const [timeLeft, setTimeLeft] = useState(savedState?.timeLeft ?? 0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isReviewVisible, setIsReviewVisible] = useState(false);

  // Save timeLeft to sessionStorage whenever it changes
  useEffect(() => {
    if (timeLeft > 0) {
      const stateToSave = {
        timeLeft,
        type, // ✅ Save type for debugging
        timestamp: Date.now(),
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }
  }, [timeLeft, type, STORAGE_KEY]);

  useEffect(() => {
    // If we have saved state and it's valid, don't reset the timer
    if (savedState?.timeLeft > 0) {
      return;
    }

    if (type === "reading") {
      setTimeLeft(60 * 60);
      previousTotalRef.current = 60 * 60;
      return;
    }

    if (totalExamTimeInSeconds) {
      const previousTotal = previousTotalRef.current;

      if (!previousTotal || previousTotal <= 0) {
        setTimeLeft(totalExamTimeInSeconds);
      } else if (totalExamTimeInSeconds > previousTotal) {
        const additionalTime = totalExamTimeInSeconds - previousTotal;
        setTimeLeft((prev) => prev + additionalTime);
      } else {
        setTimeLeft(totalExamTimeInSeconds);
      }

      previousTotalRef.current = totalExamTimeInSeconds;
    } else {
      setTimeLeft(30 * 60);
      previousTotalRef.current = 30 * 60;
    }
  }, [type, totalExamTimeInSeconds, savedState]);

  const handleModalOk = useCallback(async () => {
    setLoading(true);
    const latestAnswer = store.getState().exam.answers;
    const request = {
      type: type,
      questionAnswers: latestAnswer,
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
      // Clear saved state after successful submission
      sessionStorage.removeItem(STORAGE_KEY);
      dispatch(clearExamAnswers());
      navigate(`/exam/${id}`);
    } catch (error) {
      console.error("Error submitting answers:", error);
      toast.error("Failed to submit answers. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [type, id, navigate, dispatch, STORAGE_KEY]);

  useEffect(() => {
    const timer = setInterval(() => {
      if ((type === "listening" && isTimerReady) || type === "reading") {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            setIsModalVisible(true);
            setTimeout(() => {
              handleModalOk();
            }, 2000);
            return 0;
          }
          return prevTime - 0.01;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [type, isTimerReady, handleModalOk]);

  const formatTime = (seconds) => {
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (seconds == 0) return <span>--</span>;
    return (
      <span style={{ color: minutes <= 1 ? "red" : "black" }}>
        <span style={{ fontWeight: "bold" }}>
          {minutes > 0
            ? minutes.toString().padStart(2, "0")
            : secs.toString().padStart(2, "0")}
        </span>{" "}
        {minutes > 0 ? "minutes" : "seconds"} remaining
      </span>
    );
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
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <img src={logo} alt="Logo" width={100} />
          </div>
          <span
            style={{
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <ClockCircleOutlined
              style={{
                fontSize: "16px",
                color: timeLeft <= 60 ? "red" : "black",
              }}
            />
            {type === "reading" || (type === "listening" && isTimerReady)
              ? formatTime(timeLeft)
              : "--"}
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
            <Dropdown
              menu={{
                items: [
                  {
                    label: (
                      <Flex justify="space-between" align="center" gap={20}>
                        <span>Text Size</span>
                        <Select
                          style={{ width: 90 }}
                          defaultValue={
                            localStorage.getItem("size") || "middle"
                          }
                          onChange={(e) => dispatch(changeSize({ size: e }))}
                        >
                          <Select.Option value="12">Small</Select.Option>
                          <Select.Option value="16">Middle</Select.Option>
                          <Select.Option value="20">Large</Select.Option>
                        </Select>
                      </Flex>
                    ),
                    disabled: true,
                    key: "1",
                  },
                ],
              }}
              trigger={["click"]}
            >
              <Button icon={<SettingOutlined />} />
            </Dropdown>
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
        footer={
          timeLeft > 0 && [
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
          ]
        }
        centered
      >
        <Result
          title={
            timeLeft <= 0
              ? "Time is up. sending your answers"
              : "Are you sure you want to submit?"
          }
        />
      </Modal>
    </>
  );
};

export default ExamHeader;
