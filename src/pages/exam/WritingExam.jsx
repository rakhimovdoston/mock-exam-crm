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
import ExtraTimeNoticeModal from "../../components/modal/ExtraTimeNoticeModal";
import SectionFinishedModal from "../../components/modal/SectionFinishedModal";
import useExamTime from "../../hooks/useExamTime";
import useExamDraft from "../../hooks/useExamDraft";
import "../../styles/exam.css";

const { Footer, Content } = Layout;

// Official IELTS minimums, shown as a live target under the answer box.
const WORD_TARGETS = { task1: 150, task2: 250 };

/** "Saved 10:42" — the student only needs the wall-clock time of the last save. */
const formatSavedAt = (isoString) => {
  const saved = new Date(isoString);
  if (Number.isNaN(saved.getTime())) return null;

  return saved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const WritingExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const answersRef = useRef([]);
  const taskRef = useRef(true);
  const [answers, setAnswers] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [content, setContent] = useState();
  const [isErrorSending, setIsErrorSending] = useState(false);
  const [fullScreen, setFullScreen] = useState(isFullScreen());
  const { data, error, loading } = useApiRequest(
    `api/v1/exam/module/${id}?moduleType=writing`
  );

  useExamSecurity({ allowTypingShortcuts: true });

  // The clock belongs to the server: there is no local duration any more, and
  // extra time granted by an invigilator lands within one poll.
  const {
    remainingMs,
    remainingSeconds,
    started,
    finished,
    change,
    refresh,
    notFound,
  } = useExamTime(id, "writing");

  // The paper and the draft arrive independently, so a draft that lands first
  // waits here until the two tasks exist to merge it into.
  const [pendingDraft, setPendingDraft] = useState(null);
  const draftAppliedRef = useRef(false);
  const expiryHandledRef = useRef(false);

  // Assigned during render, not in an effect: the autosave effect below reads
  // them, and an effect-synced ref would still hold the previous render's value
  // — a single keystroke could then look like "no change" and never be saved.
  answersRef.current = answers;
  taskRef.current = task;

  const { savedAt, saveNow, markDirty } = useExamDraft(id, "writing", {
    // Read through refs at save time, so a save always sends what is on screen.
    getContent: () => ({ answers: answersRef.current, task: taskRef.current }),
    onRestore: setPendingDraft,
  });

  useEffect(() => {
    if (draftAppliedRef.current || !pendingDraft || answers.length === 0) return;

    draftAppliedRef.current = true;

    // Merged onto the tasks that were just loaded rather than swapped in, so a
    // draft written against an older paper cannot reshape this one.
    const savedByTask = new Map(
      (pendingDraft.answers || []).map((item) => [item.task, item.answer])
    );

    setAnswers((current) =>
      current.map((item) =>
        savedByTask.has(item.task)
          ? { ...item, answer: savedByTask.get(item.task) ?? "" }
          : item
      )
    );

    if (typeof pendingDraft.task === "boolean") setTask(pendingDraft.task);
    setPendingDraft(null);
    toast.info("Your saved answers have been restored.");
  }, [pendingDraft, answers.length]);

  // Every keystroke schedules a save; the hook skips it if nothing changed.
  useEffect(() => {
    markDirty();
  }, [answers, task, markDirty]);

  // The exam is gone — there is nothing to sit.
  useEffect(() => {
    if (!notFound) return;

    toast.error("This exam was not found.");
    navigate("/");
  }, [notFound, navigate]);

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
      navigate(`/exam/${id}`);
    } catch (error) {
      setIsErrorSending(true);
      console.error("Error submitting answers:", error);
      toast.error("Failed to submit answers. Please try again.");
    } finally {
      setSaveLoading(false);
    }
  }, [id, navigate]);

  const expired = started && !finished && remainingMs <= 0;

  // Running out does not submit on its own. Extra time may have been granted in
  // the very minute the clock hit zero, so the server gets the last word before
  // forty minutes of writing are sent off against a stale clock.
  useEffect(() => {
    if (!expired) {
      expiryHandledRef.current = false;
      return;
    }

    if (expiryHandledRef.current) return;
    expiryHandledRef.current = true;

    (async () => {
      try {
        const fresh = await refresh();
        if ((fresh?.leftDurationMs ?? 0) > 0) {
          expiryHandledRef.current = false;
          return;
        }
      } catch (error) {
        // Offline at the buzzer: submit rather than leave the student stuck.
        console.error("Final clock check failed:", error);
      }

      setIsModalVisible(true);
      window.setTimeout(handleModalOk, 2000);
    })();
  }, [expired, refresh, handleModalOk]);

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
  const isTimerVisible = started && !finished;
  const savedLabel = savedAt ? formatSavedAt(savedAt) : null;

  const timerClassName = [
    "exam-timer",
    isTimerVisible && remainingSeconds <= 60 ? "exam-timer--danger" : "",
    isTimerVisible && remainingSeconds > 60 && remainingSeconds <= 300
      ? "exam-timer--warn"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Layout style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="exam-header">
        <BrandMark />

        <div className={timerClassName}>
          <ClockCircleOutlined />
          {isTimerVisible ? (
            <>
              <span>{formatTime(remainingSeconds)}</span>
              <span className="exam-timer__unit">remaining</span>
            </>
          ) : (
            <span className="exam-timer__unit">
              {finished ? "section finished" : "waiting to start…"}
            </span>
          )}
        </div>

        <div className="exam-header__actions">
          {savedLabel && (
            <span className="exam-saved" title="Your answers are saved">
              Saved {savedLabel}
            </span>
          )}

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

      <ExtraTimeNoticeModal
        open={Boolean(change)}
        message={change?.message}
        saveDraft={saveNow}
      />

      <SectionFinishedModal
        open={finished}
        onLeave={() => navigate(`/exam/${id}`)}
      />

      <Modal
        open={isModalVisible}
        closable={remainingMs > 0}
        maskClosable={false}
        footer={
          (remainingMs > 0 || isErrorSending) && [
            <Button
              key="cancel"
              onClick={handleModalCancel}
              disabled={remainingMs <= 0}
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
          status={remainingMs <= 0 ? "info" : "warning"}
          title={
            remainingMs <= 0
              ? "Time is up — sending your answers"
              : "Submit both tasks?"
          }
          subTitle={
            remainingMs <= 0
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
