import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Badge,
  Button,
  Drawer,
  Dropdown,
  Empty,
  Flex,
  Modal,
  Result,
  Segmented,
  Tooltip,
} from "antd";
import {
  ClockCircleOutlined,
  DeleteOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  ProfileOutlined,
  ReadOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import apiClient from "../../services/api";
import { enterFullScreen, isFullScreen } from "../../utils/documentUtils";
import AnswerReviewModal from "../modal/AnswerReviewModal";
import ExtraTimeNoticeModal from "../modal/ExtraTimeNoticeModal";
import SectionFinishedModal from "../modal/SectionFinishedModal";
import ThemeSwitcher from "../ThemeSwitcher";
import BrandMark from "./BrandMark";
import store from "../../store";
import { changeSize } from "../../store/appReducer";
import { clearExamAnswers } from "../../store/examReducer";
import { clearStoredAnnotations } from "../../utils";
import { clearAudioPosition } from "../../utils/examAudio";
import { removeNote, useExamNotes } from "../../utils/examNotes";
import useExamTime from "../../hooks/useExamTime";
import "../../styles/exam.css";

const TEXT_SIZES = [
  { label: "Small", value: "12" },
  { label: "Medium", value: "16" },
  { label: "Large", value: "20" },
];

const EMPTY_SOURCES = [];

/** "Saved 10:42" — the student only needs the wall-clock time of the last save. */
const formatSavedAt = (isoString) => {
  const saved = new Date(isoString);
  if (Number.isNaN(saved.getTime())) return null;

  return saved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const ExamHeader = ({
  type,
  // Which viewers on this page can be annotated, and how to describe each one
  // in the notes panel. Writing has none, so the panel stays hidden there.
  noteSources = EMPTY_SOURCES,
  onJumpToNote,
  // The page owns its draft — only it knows what its answers look like.
  saveDraft,
  draftSavedAt,
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const textSize = useSelector((state) => state.app.size);
  const [fullScreen, setFullScreen] = useState(isFullScreen());

  // The clock belongs to the server: nothing here decides how long a module
  // lasts, and nothing is cached locally, so extra time lands within one poll.
  const {
    remainingMs,
    remainingSeconds,
    started,
    finished,
    change,
    refresh,
    notFound,
  } = useExamTime(id, type);

  const expiryHandledRef = useRef(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isReviewVisible, setIsReviewVisible] = useState(false);
  const [isNotesVisible, setIsNotesVisible] = useState(false);
  const [isErrorSending, setIsErrorSending] = useState(false);

  const notes = useExamNotes(noteSources);

  // Grouped by part, so the list reads in the same order as the exam does.
  const noteGroups = useMemo(() => {
    const groups = new Map();

    notes.forEach((note) => {
      const label = note.partLabel || "";
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(note);
    });

    return Array.from(groups, ([label, items]) => ({ label, items }));
  }, [notes]);

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
      clearStoredAnnotations();
      // Only listening keeps one, and a reset-and-retry must start over.
      if (type === "listening") clearAudioPosition(id);
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
  }, [type, id, navigate, dispatch]);

  const expired = started && !finished && remainingMs <= 0;

  // Running out does not submit on its own. Extra time may have been granted in
  // the very minute the clock hit zero, so the server gets the last word before
  // anything is sent — otherwise a student would submit against a stale clock.
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

  // The exam is gone — there is nothing to sit.
  useEffect(() => {
    if (!notFound) return;

    toast.error("This exam was not found.");
    navigate("/");
  }, [notFound, navigate]);

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

  const isTimerVisible = started && !finished;

  const timerClassName = [
    "exam-timer",
    isTimerVisible && remainingSeconds <= 60 ? "exam-timer--danger" : "",
    isTimerVisible && remainingSeconds > 60 && remainingSeconds <= 300
      ? "exam-timer--warn"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const savedLabel = draftSavedAt ? formatSavedAt(draftSavedAt) : null;

  return (
    <>
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

          {noteSources.length > 0 && (
            <Badge count={notes.length} size="small" offset={[-4, 2]}>
              <Button
                icon={<ReadOutlined />}
                onClick={() => setIsNotesVisible(true)}
              >
                Notes
              </Button>
            </Badge>
          )}

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

      <Drawer
        title={`Your notes${notes.length ? ` (${notes.length})` : ""}`}
        placement="right"
        width={400}
        open={isNotesVisible}
        onClose={() => setIsNotesVisible(false)}
      >
        {notes.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No notes yet. Select any text, then choose Note."
          />
        ) : (
          noteGroups.map((group) => (
            <section key={group.label} className="exam-notelist__group">
              <h4 className="exam-notelist__heading">{group.label}</h4>

              {group.items.map((note) => (
                <div
                  key={note.id}
                  role="button"
                  tabIndex={0}
                  className="exam-notelist__item"
                  // Opening the note means going to it, so the panel gets out
                  // of the way — it covers the text it is pointing at.
                  onClick={() => {
                    setIsNotesVisible(false);
                    onJumpToNote?.(note);
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    setIsNotesVisible(false);
                    onJumpToNote?.(note);
                  }}
                >
                  <span className="exam-notelist__where">
                    {note.sectionLabel}
                  </span>
                  <p className="exam-notelist__quote">“{note.quote}”</p>
                  <p className="exam-notelist__text">{note.note}</p>

                  <Tooltip title="Delete note">
                    <button
                      type="button"
                      aria-label="Delete note"
                      className="exam-notelist__delete"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeNote(note.storageKey, note.id);
                      }}
                    >
                      <DeleteOutlined />
                    </button>
                  </Tooltip>
                </div>
              ))}
            </section>
          ))
        )}
      </Drawer>

      <ExtraTimeNoticeModal
        open={Boolean(change)}
        message={change?.message}
        saveDraft={saveDraft}
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
              loading={loading}
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
              : "Submit your answers?"
          }
          subTitle={
            remainingMs <= 0
              ? "Please wait, do not close this window."
              : "You cannot return to this section after submitting."
          }
        />
      </Modal>
    </>
  );
};

export default ExamHeader;
