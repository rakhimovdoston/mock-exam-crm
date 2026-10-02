import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button, Modal, Progress, Result, Spin, Tag, Typography, theme } from "antd";
import {
  AudioOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  ExclamationCircleFilled,
  LockOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/authReducer";
import useApiRequest from "../hooks/useApiRequest";
import { useNavigate, useParams } from "react-router-dom";
import { enterFullScreen, isFullScreen } from "../utils/documentUtils";
import { ensureMicrophoneAccess } from "../utils/microphone";
import CandidateTopBar from "../components/layouts/CandidateTopBar";
import { useT } from "../i18n/useT";

const { Title, Text } = Typography;

const LOW_TIME_SECONDS = 5 * 60;

const UserPage = () => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [fullScreen, setFullScreen] = useState(isFullScreen());
  const [endModalOpen, setEndModalOpen] = useState(false);
  const startedRef = useRef(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const { token } = theme.useToken();
  const t = useT();

  const { data, loading, error } = useApiRequest(`api/v1/exam/get/${id}`, [id]);

  /**
   * How long this sitting's Listening actually runs.
   *
   * It is the sum of the recordings this exam was built from, so it differs
   * between exams and cannot be written down anywhere. Read per exam, never
   * cached — and asking here also warms the server's own figure, so the module
   * page does not have to wait for it to be worked out from the audio.
   *
   * Purely informational: a failure leaves the line without a length rather
   * than holding up the page.
   */
  const { data: listeningClock } = useApiRequest(
    id ? `api/v1/exam/time-state/${id}?moduleType=listening` : null,
    [id]
  );

  useEffect(() => {
    if (data?.data && data?.data.leftDuration) {
      startedRef.current = true;
      setTimeLeft(Math.floor(Number(data.data.leftDuration) / 1000));
    }
  }, [data]);

  useEffect(() => {
    if (startedRef.current && timeLeft === 0) {
      sessionStorage.clear();
      dispatch(logout());
    }
  }, [timeLeft, dispatch]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Keep the header icon in sync when the user leaves full screen with Esc.
  useEffect(() => {
    const sync = () => setFullScreen(isFullScreen());
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [hours, minutes, secs]
      .map((part) => part.toString().padStart(2, "0"))
      .join(":");
  };

  const handleExit = () => dispatch(logout());

  const startListening = useCallback(async () => {
    // The same check the reopened-sections card makes before a retake, so a
    // first sitting and a second one cannot drift apart in what they require.
    const allowed = await ensureMicrophoneAccess();
    if (allowed) navigate(`/listening/${id}`);
  }, [id, navigate]);

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

  const exam = data?.data;
  const isLowTime = startedRef.current && timeLeft <= LOW_TIME_SECONDS;

  // A reopened module looks exactly like one never taken — its answers were
  // deleted, so its flag is back to false. This is the only thing that tells
  // the two apart, and a candidate who has already sat it needs to be told.
  const reopenedModules = new Set(exam?.reopenedModules || []);

  const listeningMs = Number(listeningClock?.data?.durationMs);
  const listeningMeta = [
    "4 parts",
    "40 questions",
    listeningMs > 0 ? `~${Math.round(listeningMs / 60000)} min` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const modules = exam
    ? [
        {
          key: "listening",
          title: "Listening",
          icon: <AudioOutlined />,
          meta: listeningMeta,
          hint: "Each audio is played once. Headphones and microphone access are required.",
          done: exam.listening,
          reopened: reopenedModules.has("listening"),
          unlocked: true,
          lockedHint: "",
          onStart: startListening,
        },
        {
          key: "reading",
          title: "Reading",
          icon: <ReadOutlined />,
          meta: "3 passages · 40 questions · 60 min",
          hint: "Read each passage and answer the questions on the right.",
          done: exam.reading,
          reopened: reopenedModules.has("reading"),
          unlocked: Boolean(exam.listening),
          lockedHint: "Finish Listening to unlock",
          onStart: () => navigate(`/reading/${id}`),
        },
        {
          key: "writing",
          title: "Writing",
          icon: <EditOutlined />,
          meta: "Task 1 · Task 2 · 60 min",
          hint: "Spend about 20 minutes on Task 1 and 40 minutes on Task 2.",
          done: exam.writing,
          reopened: reopenedModules.has("writing"),
          unlocked: Boolean(exam.reading),
          lockedHint: "Finish Reading to unlock",
          onStart: () => navigate(`/writing/${id}`),
        },
      ]
    : [];

  const completed = modules.filter((module) => module.done).length;
  const allDone = modules.length > 0 && completed === modules.length;

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
        minHeight: "100vh",
        background: `
          radial-gradient(900px 420px at 50% -120px, var(--exam-glow), transparent 70%),
          ${token.colorBgLayout}`,
      }}
    >
      <CandidateTopBar
        user={user}
        onExit={handleExit}
        fullScreen={fullScreen}
        onToggleFullScreen={enterFullScreen}
      />

      <main
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          padding: "40px 24px 32px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 760 }}>
          {error || !exam ? (
            <div style={{ ...surface, padding: 8 }}>
              <Result
                status="info"
                title="All questions completed"
                subTitle="You have already completed all questions. If you want new questions, please contact the instructor."
                extra={
                  <Button type="primary" onClick={handleExit}>
                    Exit
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              {allDone ? (
                /* Every module is submitted: the countdown no longer matters,
                   what the candidate needs is confirmation and what happens
                   next. */
                <div
                  style={{
                    ...surface,
                    padding: "30px 28px",
                    marginBottom: 20,
                    textAlign: "center",
                    borderColor: token.colorSuccessBorder,
                    background: token.colorSuccessBg,
                  }}
                >
                  <CheckCircleOutlined
                    style={{
                      fontSize: 46,
                      color: token.colorSuccess,
                      marginBottom: 14,
                    }}
                  />
                  <Title level={3} style={{ margin: 0, fontSize: 22 }}>
                    {t("examDone.title")}
                  </Title>
                  <Text
                    style={{
                      display: "block",
                      marginTop: 8,
                      fontSize: 16,
                      fontWeight: 600,
                      color: token.colorSuccessTextActive,
                    }}
                  >
                    {t("examDone.text")}
                  </Text>
                  <Text
                    type="secondary"
                    style={{ display: "block", marginTop: 6, fontSize: 13 }}
                  >
                    {t("examDone.note")}
                  </Text>
                </div>
              ) : null}

              {/* Session timer */}
              <div
                style={{
                  ...surface,
                  padding: "22px 24px",
                  marginBottom: 20,
                  display: allDone ? "none" : "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: 0.6,
                      textTransform: "uppercase",
                    }}
                  >
                    Time remaining
                  </Text>
                  <Title
                    level={2}
                    style={{
                      margin: "4px 0 0",
                      fontSize: 34,
                      fontVariantNumeric: "tabular-nums",
                      color: isLowTime ? token.colorError : token.colorText,
                    }}
                  >
                    <ClockCircleOutlined
                      style={{ fontSize: 26, marginRight: 10 }}
                    />
                    {formatTime(timeLeft)}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Your session closes automatically when the clock reaches
                    zero.
                  </Text>
                </div>

                <div style={{ textAlign: "center" }}>
                  <Progress
                    type="circle"
                    size={76}
                    percent={Math.round((completed / modules.length) * 100)}
                    format={() => (
                      <span style={{ fontSize: 14, fontWeight: 600 }}>
                        {completed}/{modules.length}
                      </span>
                    )}
                    strokeColor={token.colorPrimary}
                  />
                  <div style={{ marginTop: 6 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Modules done
                    </Text>
                  </div>
                </div>
              </div>

              {/* Modules */}
              <div style={{ display: "grid", gap: 14 }}>
                {modules.map((module, index) => {
                  const isActive = !module.done && module.unlocked;
                  const isLocked = !module.done && !module.unlocked;
                  // Sat once already and open again. Worth its own colour:
                  // silently showing "Start" invites "but I did this one".
                  const isRetake = module.reopened && !module.done;

                  return (
                    <div
                      key={module.key}
                      style={{
                        ...surface,
                        padding: 20,
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        opacity: isLocked ? 0.65 : 1,
                        borderColor: isRetake
                          ? token.colorWarning
                          : isActive
                          ? token.colorPrimary
                          : token.colorBorderSecondary,
                        boxShadow: isActive
                          ? `0 0 0 3px ${
                              isRetake ? token.colorWarningBg : token.colorPrimaryBg
                            }`
                          : "none",
                        transition: "border-color 0.2s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flex: "0 0 auto",
                          width: 46,
                          height: 46,
                          borderRadius: 14,
                          fontSize: 20,
                          color: module.done
                            ? token.colorSuccess
                            : isLocked
                            ? token.colorTextTertiary
                            : isRetake
                            ? token.colorWarning
                            : token.colorPrimary,
                          background: module.done
                            ? token.colorSuccessBg
                            : isLocked
                            ? token.colorFillSecondary
                            : isRetake
                            ? token.colorWarningBg
                            : token.colorPrimaryBg,
                        }}
                      >
                        {isLocked ? <LockOutlined /> : module.icon}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <Text strong style={{ fontSize: 16 }}>
                            {index + 1}. {module.title}
                          </Text>
                          {module.done && (
                            <Tag
                              color="success"
                              icon={<CheckCircleFilled />}
                              style={{ marginInlineEnd: 0 }}
                            >
                              Completed
                            </Tag>
                          )}
                          {isRetake ? (
                            <Tag
                              color="warning"
                              icon={<ExclamationCircleFilled />}
                              style={{ marginInlineEnd: 0 }}
                            >
                              Retake
                            </Tag>
                          ) : (
                            isActive && (
                              <Tag color="processing" style={{ marginInlineEnd: 0 }}>
                                Up next
                              </Tag>
                            )
                          )}
                        </div>
                        <Text
                          type="secondary"
                          style={{ display: "block", fontSize: 13 }}
                        >
                          {module.meta}
                        </Text>
                        <Text
                          type="secondary"
                          style={{ display: "block", fontSize: 13 }}
                        >
                          {isLocked
                            ? module.lockedHint
                            : isRetake
                            ? "This section was reopened for you. Your previous answers for it were cleared."
                            : module.hint}
                        </Text>
                      </div>

                      <Button
                        type="primary"
                        size="large"
                        disabled={!isActive}
                        onClick={module.onStart}
                        style={{ minWidth: 116, borderRadius: 999 }}
                      >
                        {module.done ? "Done" : isRetake ? "Retake" : "Start"}
                      </Button>
                    </div>
                  );
                })}
              </div>

              {/* End test */}
              <div
                style={{
                  marginTop: 24,
                  textAlign: "center",
                }}
              >
                <Button
                  danger
                  size="large"
                  disabled={!allDone}
                  onClick={() => setEndModalOpen(true)}
                  style={{ minWidth: 200, borderRadius: 999 }}
                >
                  End Test
                </Button>
                <div style={{ marginTop: 10 }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {allDone
                      ? t("examDone.text")
                      : "Available once all three modules are completed."}
                  </Text>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Modal
        open={endModalOpen}
        onCancel={() => setEndModalOpen(false)}
        onOk={() => {
          sessionStorage.clear();
          dispatch(logout());
        }}
        okText="End test"
        okButtonProps={{ danger: true }}
        cancelText="Cancel"
        title="End your test?"
      >
        <Text type="secondary">
          Your answers have already been submitted. Ending the test signs you
          out of this session.
        </Text>
      </Modal>
    </div>
  );
};

export default UserPage;
