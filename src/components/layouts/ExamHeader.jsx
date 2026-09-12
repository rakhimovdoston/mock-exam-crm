import React, { useEffect, useRef, useState, useCallback } from "react";
import { Button, Dropdown, Flex, Modal, Result, Segmented, Tooltip } from "antd";
import {
  ClockCircleOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  ProfileOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import apiClient from "../../services/api";
import { enterFullScreen, isFullScreen } from "../../utils/documentUtils";
import AnswerReviewModal from "../modal/AnswerReviewModal";
import ThemeSwitcher from "../ThemeSwitcher";
import BrandMark from "./BrandMark";
import store from "../../store";
import { changeSize } from "../../store/appReducer";
import { clearExamAnswers } from "../../store/examReducer";
import "../../styles/exam.css";

const TEXT_SIZES = [
  { label: "Small", value: "12" },
  { label: "Medium", value: "16" },
  { label: "Large", value: "20" },
];

const ExamHeader = ({
  type,
  totalExamTimeInSeconds = 0,
  isTimerReady = false,
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const previousTotalRef = useRef(null);
  const textSize = useSelector((state) => state.app.size);
  const [fullScreen, setFullScreen] = useState(isFullScreen());

  // ✅ Updated: More specific storage key
  const STORAGE_KEY = `exam_timer_${type}_${id}`;

  // Load saved state from sessionStorage
  const getSavedState = () => {
    if (type === "listening") return null;
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
  const [isErrorSending, setIsErrorSending] = useState(false);

  // Save timeLeft to sessionStorage whenever it changes
  useEffect(() => {
    if (timeLeft > 0) {
      const stateToSave = {
        timeLeft,
        type,
        timestamp: Date.now(),
      };
      if (type === "reading") {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      }
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
    setIsErrorSending(false);
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
        setIsErrorSending(true);
        return;
      }
      sessionStorage.removeItem(STORAGE_KEY);
      toast.success("Answers submitted successfully!");
      dispatch(clearExamAnswers());
      navigate(`/exam/${id}`);
    } catch (error) {
      setIsErrorSending(true);
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
          return prevTime - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [type, isTimerReady, handleModalOk]);

  // Keep the icon in sync when the browser leaves full screen via Esc.
  useEffect(() => {
    const sync = () => setFullScreen(isFullScreen());
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const isTimerVisible =
    type === "reading" || (type === "listening" && isTimerReady);

  const timerClassName = [
    "exam-timer",
    isTimerVisible && timeLeft <= 60 ? "exam-timer--danger" : "",
    isTimerVisible && timeLeft > 60 && timeLeft <= 300 ? "exam-timer--warn" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <header className="exam-header">
        <BrandMark />

        <div className={timerClassName}>
          <ClockCircleOutlined />
          {isTimerVisible ? (
            <>
              <span>{formatTime(timeLeft)}</span>
              <span className="exam-timer__unit">remaining</span>
            </>
          ) : (
            <span className="exam-timer__unit">preparing audio…</span>
          )}
        </div>

        <div className="exam-header__actions">
          <ThemeSwitcher type="default" />

          <Tooltip title={fullScreen ? "Exit full screen" : "Full screen"}>
            <Button
              aria-label={fullScreen ? "Exit full screen" : "Full screen"}
              onClick={enterFullScreen}
              icon={
                fullScreen ? (
                  <FullscreenExitOutlined />
                ) : (
                  <FullscreenOutlined />
                )
              }
            />
          </Tooltip>

          <Dropdown
            trigger={["click"]}
            placement="bottomRight"
            dropdownRender={() => (
              <div
                style={{
                  background: "var(--exam-surface)",
                  border: "1px solid var(--exam-border)",
                  borderRadius: 12,
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.18)",
                  padding: 14,
                }}
              >
                <Flex vertical gap={8}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    Text size
                  </span>
                  <Segmented
                    options={TEXT_SIZES}
                    value={String(textSize)}
                    onChange={(value) => dispatch(changeSize({ size: value }))}
                  />
                </Flex>
              </div>
            )}
          >
            <Tooltip title="Text size">
              <Button aria-label="Text size" icon={<SettingOutlined />} />
            </Tooltip>
          </Dropdown>

          <Button
            icon={<ProfileOutlined />}
            onClick={() => setIsReviewVisible(true)}
          >
            Review
          </Button>

          <Button
            type="primary"
            style={{ fontWeight: 600 }}
            onClick={() => setIsModalVisible(true)}
          >
            Submit
          </Button>
        </div>
      </header>

      <AnswerReviewModal
        open={isReviewVisible}
        onClose={() => setIsReviewVisible(false)}
      />

      <Modal
        open={isModalVisible}
        closable={timeLeft > 0}
        maskClosable={false}
        footer={
          (timeLeft > 0 || isErrorSending) && [
            <Button
              key="cancel"
              onClick={handleModalCancel}
              disabled={timeLeft <= 0}
            >
              Cancel
            </Button>,
            <Button
              key="submit"
              type="primary"
              onClick={handleModalOk}
              loading={loading}
            >
              {isErrorSending ? "Re-submit" : "Submit answers"}
            </Button>,
          ]
        }
        centered
      >
        <Result
          status={timeLeft <= 0 ? "info" : "warning"}
          title={
            timeLeft <= 0
              ? "Time is up — sending your answers"
              : "Submit your answers?"
          }
          subTitle={
            timeLeft <= 0
              ? "Please wait, do not close this window."
              : "You cannot return to this section after submitting."
          }
        />
      </Modal>
    </>
  );
};

export default ExamHeader;
