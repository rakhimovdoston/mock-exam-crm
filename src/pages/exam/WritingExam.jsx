import React, { useEffect, useRef, useState, useCallback } from "react";
import useApiRequest from "../../hooks/useApiRequest";
import useExamSecurity from "../../hooks/useExamSecurity";
import { useNavigate, useParams } from "react-router-dom";
import { Layout, Button, Modal, Spin, Input, Splitter, Result, Tooltip } from "antd";
import {
  ClockCircleOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import apiClient from "../../services/api";
import { enterFullScreen, isFullScreen } from "../../utils/documentUtils";
import BrandMark from "../../components/layouts/BrandMark";
import ThemeSwitcher from "../../components/ThemeSwitcher";
import "../../styles/exam.css";

const { Footer, Content } = Layout;

// Official IELTS minimums, shown as a live target under the answer box.
const WORD_TARGETS = { task1: 150, task2: 250 };

const WritingExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const STORAGE_KEY = `writing_exam_${id}`;

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

  const [task, setTask] = useState(savedState?.task ?? true);
  const [timeLeft, setTimeLeft] = useState(savedState?.timeLeft ?? 60 * 60);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const answersRef = useRef([]);
  const [answers, setAnswers] = useState(savedState?.answers ?? []);
  const [saveLoading, setSaveLoading] = useState(false);
  const [content, setContent] = useState();
  const [isErrorSending, setIsErrorSending] = useState(false);
  const [fullScreen, setFullScreen] = useState(isFullScreen());
  const { data, error, loading } = useApiRequest(
    `api/v1/exam/module/${id}?moduleType=writing`
  );

  useExamSecurity({ allowTypingShortcuts: true });

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    const stateToSave = {
      task,
      timeLeft,
      answers,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [task, timeLeft, answers, STORAGE_KEY]);

  useEffect(() => {
    if (data && data?.data) {
      const filteredQuestions = data?.data?.filter(
        (question) => question.task === task
      );

      setContent(filteredQuestions[0]);
    }
  }, [data?.data, task]);

  useEffect(() => {
    if (data && data?.data && answers.length === 0) {
      const initAnswers = data.data.map((item) => {
        return {
          id: item.id,
          task: item.task,
          answer: "",
        };
      });

      setAnswers(initAnswers);
    }
  }, [data, answers.length]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Keep the icon in sync when the browser leaves full screen via Esc.
  useEffect(() => {
    const sync = () => setFullScreen(isFullScreen());
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const handleModalOk = useCallback(async () => {
    const latestAnswers = answersRef.current;
    setSaveLoading(true);
    setIsErrorSending(false);
    const request = {
      answers: latestAnswers,
    };

    try {
      const response = await apiClient.post(
        `/api/v1/exam/writing/${id}`,
        request
      );
      if (response.code !== 200) {
        toast.error(
          response.message || "Failed to submit answers. Please try again."
        );
        setIsErrorSending(true);
        return;
      }
      toast.success("Answers submitted successfully!");
      // Clear saved state after successful submission
      sessionStorage.removeItem(STORAGE_KEY);
      navigate(`/exam/${id}`);
    } catch (error) {
      setIsErrorSending(true);
      console.error("Error submitting answers:", error);
      toast.error("Failed to submit answers. Please try again.");
    } finally {
      setSaveLoading(false);
    }
  }, [id, navigate, STORAGE_KEY]);

  useEffect(() => {
    const timer = setInterval(() => {
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
    }, 1000);

    return () => clearInterval(timer);
  }, [handleModalOk]);

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

  const countWords = (text) =>
    text && text.trim() ? text.trim().split(/\s+/).length : 0;

  const getWordCountFor = (taskFlag) =>
    countWords(answers.find((ans) => ans.task === taskFlag)?.answer);

  const getValue = () => {
    return answers.find((ans) => ans.task === task)?.answer || "";
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

  if (error || !data?.data) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Result
          status="warning"
          title="We could not load this section"
          subTitle="Please refresh the page. If the problem continues, call your invigilator."
          extra={
            <Button type="primary" onClick={() => window.location.reload()}>
              Reload
            </Button>
          }
        />
      </div>
    );
  }

  const wordTarget = task ? WORD_TARGETS.task1 : WORD_TARGETS.task2;
  const wordCount = getWordCountFor(task);
  const timerClassName = [
    "exam-timer",
    timeLeft <= 60 ? "exam-timer--danger" : "",
    timeLeft > 60 && timeLeft <= 300 ? "exam-timer--warn" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Layout style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="exam-header">
        <BrandMark />

        <div className={timerClassName}>
          <ClockCircleOutlined />
          <span>{formatTime(timeLeft)}</span>
          <span className="exam-timer__unit">remaining</span>
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
          <Button
            type="primary"
            style={{ fontWeight: 600 }}
            onClick={() => setIsModalVisible(true)}
          >
            Submit
          </Button>
        </div>
      </header>

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
              loading={saveLoading}
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
              : "Submit both tasks?"
          }
          subTitle={
            timeLeft <= 0
              ? "Please wait, do not close this window."
              : `Task 1: ${getWordCountFor(true)} words · Task 2: ${getWordCountFor(
                  false
                )} words. You cannot return after submitting.`
          }
        />
      </Modal>

      <Content
        className="exam-body"
        style={{ flex: 1, overflow: "hidden", padding: 16 }}
      >
        <Splitter style={{ height: "100%" }}>
          {content && (
            <Splitter.Panel defaultSize={"50%"} min={"30%"} max={"70%"}>
              <div className="exam-split-panel" style={{ paddingRight: 10 }}>
                <div className="exam-panel" style={{ padding: "18px 20px" }}>
                  <h2 className="exam-section-title">
                    {content.task ? "Writing Task 1" : "Writing Task 2"}
                  </h2>
                  <p
                    style={{
                      fontSize: 16,
                      lineHeight: 1.7,
                      whiteSpace: "pre-wrap",
                      margin: 0,
                    }}
                  >
                    {content.title}
                  </p>
                  {content.image && (
                    <img
                      src={content.image}
                      alt="Task"
                      style={{
                        marginTop: 16,
                        maxWidth: "100%",
                        borderRadius: 10,
                        border: "1px solid var(--exam-border)",
                      }}
                    />
                  )}
                </div>
              </div>
            </Splitter.Panel>
          )}

          <Splitter.Panel>
            <div
              className="exam-split-panel"
              style={{
                paddingLeft: 10,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                className="exam-panel"
                style={{
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  minHeight: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                    gap: 12,
                  }}
                >
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                    Your answer
                  </h2>
                  <span
                    className={`exam-wordcount${
                      wordCount >= wordTarget ? " exam-wordcount--met" : ""
                    }`}
                  >
                    {wordCount}
                    <span style={{ opacity: 0.7, fontWeight: 500 }}>
                      / {wordTarget} words
                    </span>
                  </span>
                </div>

                <Input.TextArea
                  className="exam-writing-textarea"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  value={getValue()}
                  onChange={(e) => {
                    const updatedAnswers = answers.map((ans) =>
                      ans.task === task
                        ? { ...ans, answer: e.target.value }
                        : ans
                    );
                    setAnswers(updatedAnswers);
                  }}
                  style={{ flex: 1, minHeight: 320, fontSize: 16 }}
                  placeholder={`Write your answer for ${
                    content && content.task ? "Task 1" : "Task 2"
                  } here…`}
                />
              </div>
            </div>
          </Splitter.Panel>
        </Splitter>
      </Content>

      <Footer className="exam-partnav" style={{ padding: "10px 16px" }}>
        {data.data.map((answer, index) => {
          const isActive = task === answer.task;
          const taskWords = getWordCountFor(answer.task);
          const target = answer.task ? WORD_TARGETS.task1 : WORD_TARGETS.task2;

          return (
            <div
              key={index}
              role="button"
              tabIndex={0}
              onClick={() => setTask(answer.task)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setTask(answer.task);
                }
              }}
              className={`exam-partnav__item${
                isActive ? " exam-partnav__item--active" : ""
              }`}
              style={{ justifyContent: "space-between" }}
            >
              <span className="exam-partnav__label">
                {answer.task ? "Writing Task 1" : "Writing Task 2"}
              </span>
              <span
                className={`exam-wordcount${
                  taskWords >= target ? " exam-wordcount--met" : ""
                }`}
                style={{ padding: "3px 10px", fontSize: 12 }}
              >
                {taskWords} / {target}
              </span>
            </div>
          );
        })}
      </Footer>
    </Layout>
  );
};

export default WritingExam;
