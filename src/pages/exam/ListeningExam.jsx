import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button, Layout, Progress, Result, Spin, Typography } from "antd";
import { toast } from "react-toastify";

import ExamFooter from "../../components/layouts/ExamFooter";
import ExamHeader from "../../components/layouts/ExamHeader";
import RichTextViewer from "../../components/editor/RichTextViewer";

import useApiRequest from "../../hooks/useApiRequest";
import useExamSecurity from "../../hooks/useExamSecurity";
import useExamDraft from "../../hooks/useExamDraft";
import useAudioPreloader from "../../hooks/useAudioPreloader";
import store from "../../store";
import { initilalizeExam, restoreExamAnswers } from "../../store/examReducer";
import { getPartLabel, getQuestionNumbers } from "../../utils";
import { annotationKey, revealNote } from "../../utils/examNotes";
import { readAudioPosition, writeAudioPosition } from "../../utils/examAudio";
import "../../styles/exam.css";

const { Content } = Layout;
const { Text } = Typography;

// How far, in % of the pane width, a part slides aside when it is not open.
const PANE_TRAVEL = 55;

// Panes take 0.62s to slide (see .exam-pane); scrolling to a note inside one
// before it has arrived would land on the wrong place.
const PANE_SETTLE_MS = 640;

/** Silence between recordings, as in the real test. */
const GAP_BETWEEN_AUDIOS_MS = 3000;

/** timeupdate fires several times a second; the resume point need only be close. */
const POSITION_WRITE_INTERVAL_S = 2;

/**
 * How many recordings must be on the machine before the section may begin.
 *
 * One, because that is all the candidate can listen to at once: the remaining
 * parts download during the eight-odd minutes Part 1 is playing, and waiting
 * for all four turned a fifteen-second wait into well over a minute.
 */
const START_AFTER_PARTS = 1;

const ListeningExam = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const [selectPart, setSelectPart] = useState();
  const [examStarted, setExamStarted] = useState(false);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const [playBlocked, setPlayBlocked] = useState(false);
  const [waitingForAudio, setWaitingForAudio] = useState(false);

  const audioRef = useRef(null);
  const lastWrittenSecondRef = useRef(0);
  const advanceTimerRef = useRef(null);

  const { data, error, loading } = useApiRequest(
    `api/v1/exam/module/${id}?moduleType=listening`
  );

  const examParts = useMemo(() => data?.data || [], [data]);

  useExamSecurity();

  useEffect(() => {
    if (!examParts.length) return;

    dispatch(initilalizeExam(examParts));
    setSelectPart(examParts[0]?.type);
  }, [examParts, dispatch]);

  /* ── Audio ────────────────────────────────────────────────────────────── */

  const audioSources = useMemo(
    () => examParts.map((part) => part.audio),
    [examParts]
  );

  const {
    urls: audioUrls,
    progress: audioProgress,
    failedIndexes,
    complete: downloadComplete,
    retry: retryDownload,
  } = useAudioPreloader(audioSources.length ? audioSources : null, id);

  const requiredCount = Math.min(START_AFTER_PARTS, examParts.length || 1);

  const canStart = useMemo(() => {
    if (!examParts.length) return false;

    for (let i = 0; i < requiredCount; i += 1) {
      // A part with no recording attached needs nothing downloaded.
      if (audioSources[i] && !audioUrls[i]) return false;
    }

    return true;
  }, [examParts.length, requiredCount, audioSources, audioUrls]);

  const requiredFailed = failedIndexes.some((index) => index < requiredCount);

  const percentOver = useCallback(
    (count) => {
      if (!count) return 0;

      let sum = 0;
      for (let i = 0; i < count; i += 1) {
        sum += audioSources[i] ? audioProgress[i] ?? 0 : 1;
      }

      return Math.round((sum / count) * 100);
    },
    [audioSources, audioProgress]
  );

  // Read once, lazily: after a reload the candidate is offered their place back
  // rather than the recording starting over.
  const [resumePoint] = useState(() => readAudioPosition(id));

  // Kept outside the playback effect so a background download landing — which
  // changes audioUrls and so re-runs that effect — cannot cancel a pending move
  // to the next part.
  const scheduleAdvance = useCallback((delay) => {
    clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = window.setTimeout(() => {
      setCurrentAudioIndex((previous) => previous + 1);
    }, delay);
  }, []);

  useEffect(() => () => clearTimeout(advanceTimerRef.current), []);

  useEffect(() => {
    if (!examStarted || !audioRef.current) return undefined;
    if (currentAudioIndex >= audioSources.length) return undefined;

    const audioEl = audioRef.current;
    const src = audioSources[currentAudioIndex];
    const url = audioUrls[currentAudioIndex];

    // No recording attached to this part, or its download gave up for good.
    if (!src || failedIndexes.includes(currentAudioIndex)) {
      if (src) {
        toast.error("This recording could not be loaded. Moving to the next part.", {
          toastId: `exam-audio-failed-${currentAudioIndex}`,
        });
      }

      setWaitingForAudio(false);
      scheduleAdvance(src ? GAP_BETWEEN_AUDIOS_MS : 0);
      return undefined;
    }

    // Files are published one at a time; this one has not landed yet. The
    // effect re-runs the moment it does.
    if (!url) {
      setWaitingForAudio(true);
      return undefined;
    }

    setWaitingForAudio(false);

    let cancelled = false;

    const handleTimeUpdate = () => {
      const at = audioEl.currentTime;
      if (Math.abs(at - lastWrittenSecondRef.current) < POSITION_WRITE_INTERVAL_S) {
        return;
      }

      lastWrittenSecondRef.current = at;
      writeAudioPosition(id, currentAudioIndex, at);
    };

    const handleEnded = () => {
      lastWrittenSecondRef.current = 0;
      writeAudioPosition(id, currentAudioIndex + 1, 0);
      scheduleAdvance(GAP_BETWEEN_AUDIOS_MS);
    };

    const handleError = () => {
      if (cancelled) return;

      toast.error("This recording could not be played. Moving to the next part.", {
        toastId: "exam-audio-error",
      });
      scheduleAdvance(GAP_BETWEEN_AUDIOS_MS);
    };

    audioEl.addEventListener("timeupdate", handleTimeUpdate);
    audioEl.addEventListener("ended", handleEnded);
    audioEl.addEventListener("error", handleError);

    // Assigning src restarts the element, so it is only done when the part
    // actually changed — otherwise the click that started playback is undone.
    if (audioEl.src !== url) audioEl.src = url;

    // `ended` stays true until a new source is set. Without that check, a
    // re-render during the gap between parts would replay the part just
    // finished, because play() on an ended element seeks back to the start.
    if (audioEl.paused && !audioEl.ended) {
      audioEl
        .play()
        .then(() => setPlayBlocked(false))
        .catch((err) => {
          if (cancelled) return;
          console.error("Audio playback failed:", err);
          if (err?.name === "NotAllowedError") setPlayBlocked(true);
        });
    }

    return () => {
      cancelled = true;
      audioEl.removeEventListener("timeupdate", handleTimeUpdate);
      audioEl.removeEventListener("ended", handleEnded);
      audioEl.removeEventListener("error", handleError);
    };
  }, [
    examStarted,
    currentAudioIndex,
    audioUrls,
    audioSources,
    failedIndexes,
    scheduleAdvance,
    id,
  ]);

  // Leaving the page: a detached element is paused by the browser, but a
  // navigation inside the SPA is not a detachment it reacts to quickly enough.
  useEffect(() => {
    const audioEl = audioRef.current;
    return () => audioEl?.pause();
  }, []);

  const handleStartExam = () => {
    const audioEl = audioRef.current;
    const startIndex = resumePoint?.index ?? 0;
    const seekTo = resumePoint?.time ?? 0;

    lastWrittenSecondRef.current = seekTo;

    const url = audioUrls[startIndex];

    if (audioEl && url) {
      audioEl.src = url;

      // Attached here rather than in the playback effect: the effect runs a
      // tick later, by which time a blob's metadata may already have loaded and
      // the event would have been missed.
      if (seekTo > 0) {
        audioEl.addEventListener(
          "loadedmetadata",
          () => {
            try {
              audioEl.currentTime = seekTo;
            } catch (err) {
              console.warn("Could not resume the recording:", err);
            }
          },
          { once: true }
        );
      }

      // play() is called straight out of the click, so the browser's autoplay
      // policy never gets a chance to block it.
      audioEl.play().catch(() => setPlayBlocked(true));
    }

    setCurrentAudioIndex(startIndex);
    setExamStarted(true);
  };

  const handleResumePlayback = () => {
    audioRef.current
      ?.play()
      .then(() => setPlayBlocked(false))
      .catch((err) => console.error("Audio playback failed:", err));
  };

  /* ── Answers, draft and notes ─────────────────────────────────────────── */

  const answers = useSelector((state) => state.exam.answers);

  // The paper and the draft arrive independently, so a draft that lands first
  // waits here until there is an answer sheet to merge it into.
  const [pendingDraft, setPendingDraft] = useState(null);
  const draftAppliedRef = useRef(false);

  const { savedAt, saveNow, markDirty } = useExamDraft(id, "listening", {
    // Read at save time, so a save always sends the sheet as it stands now.
    // Wrapped in an object rather than sent as a bare array: the server stores
    // the body opaquely, and an object leaves room to add to it later.
    getContent: () => ({ answers: store.getState().exam.answers }),
    onRestore: setPendingDraft,
  });

  useEffect(() => {
    if (draftAppliedRef.current || !pendingDraft || !answers.length) return;

    draftAppliedRef.current = true;
    dispatch(restoreExamAnswers(pendingDraft.answers));
    setPendingDraft(null);
    toast.info("Your saved answers have been restored.");
  }, [pendingDraft, answers.length, dispatch]);

  // Every edit schedules a save; the hook skips the request if nothing changed.
  useEffect(() => {
    markDirty();
  }, [answers, markDirty]);

  const noteSources = useMemo(
    () =>
      examParts.flatMap((part, index) =>
        part.questions.map((question) => ({
          storageKey: annotationKey(
            id,
            "listening",
            part.type,
            `q${question.id}`
          ),
          partType: part.type,
          partLabel: getPartLabel(part.type, index),
          sectionLabel: "Questions",
        }))
      ),
    [examParts, id]
  );

  const handleJumpToNote = (note) => {
    setSelectPart(note.partType);
    window.setTimeout(
      () => revealNote(note.storageKey, note.id),
      PANE_SETTLE_MS
    );
  };

  /* ── Render ───────────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="exam-stage" style={{ height: "100vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !examParts.length) {
    return (
      <div className="exam-stage" style={{ height: "100vh" }}>
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

  // Position in the filmstrip that every pane is offset against.
  const activeIndex = Math.max(
    examParts.findIndex((part) => part.type === selectPart),
    0
  );

  const renderStage = () => {
    if (requiredFailed) {
      return (
        <div className="exam-stage">
          <Result
            status="warning"
            title="The audio could not be downloaded"
            subTitle="Check your connection and try again. Files that already downloaded will not be fetched a second time."
            extra={
              <Button type="primary" onClick={retryDownload}>
                Try again
              </Button>
            }
          />
        </div>
      );
    }

    if (!canStart) {
      return (
        <div className="exam-stage">
          <div className="exam-stage__inner">
            <h2 className="exam-passage-title">Preparing the audio</h2>
            <Progress percent={percentOver(requiredCount)} status="active" />
            <p>Downloading the first recording</p>
            <Text type="secondary">
              The test starts as soon as this one is ready. The remaining parts
              download while you are listening, so nothing waits on the network
              once you have begun.
            </Text>
          </div>
        </div>
      );
    }

    if (!examStarted) {
      return (
        <div className="exam-stage">
          <Result
            status="success"
            title={resumePoint ? "Ready to continue" : "The audio is ready"}
            subTitle={
              resumePoint
                ? `The recording carries on from Part ${
                    resumePoint.index + 1
                  }, where it left off. It cannot be paused.`
                : "The recording starts as soon as you press the button. It cannot be paused."
            }
            extra={
              <Button type="primary" size="large" onClick={handleStartExam}>
                {resumePoint ? "Resume audio" : "Start test"}
              </Button>
            }
          />
        </div>
      );
    }

    return (
      <div className="exam-panes">
        {examParts.map((part, index) => (
          <div
            key={part.type}
            className={`exam-pane${
              selectPart === part.type ? " exam-pane--active" : ""
            }`}
            style={{
              overflowY: "auto",
              transform: `translateX(${
                (index - activeIndex) * PANE_TRAVEL
              }%) scale(${selectPart === part.type ? 1 : 0.985})`,
            }}
          >
            <div
              style={{ maxWidth: 1040, margin: "0 auto", padding: "28px 24px 36px" }}
            >
              {playBlocked && (
                <div className="exam-panel" style={{ padding: 16, marginBottom: 18 }}>
                  <Text strong style={{ display: "block", marginBottom: 8 }}>
                    Your browser stopped the recording from playing.
                  </Text>
                  <Button type="primary" onClick={handleResumePlayback}>
                    Play audio
                  </Button>
                </div>
              )}

              {waitingForAudio && (
                <div className="exam-panel" style={{ padding: 16, marginBottom: 18 }}>
                  <Text strong style={{ display: "block", marginBottom: 8 }}>
                    The next recording is still downloading…
                  </Text>
                  <Progress
                    percent={Math.round(
                      (audioProgress[currentAudioIndex] ?? 0) * 100
                    )}
                    status="active"
                  />
                </div>
              )}

              {!downloadComplete && !waitingForAudio && (
                <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
                  Downloading the remaining recordings — {percentOver(examParts.length)}%
                </Text>
              )}

              {part.questions.map((question) => (
                <div
                  key={question.id}
                  className="exam-panel"
                  style={{ padding: "18px 20px", marginBottom: 18 }}
                >
                  <h2 className="exam-section-title">
                    Questions {getQuestionNumbers(question)}
                  </h2>
                  <RichTextViewer
                    content={question.content}
                    type={question.type}
                    storageKey={annotationKey(
                      id,
                      "listening",
                      part.type,
                      `q${question.id}`
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Layout
      style={{
        position: "relative",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Kept mounted through every stage, so the element is already there when
          the click that starts playback arrives. */}
      <audio ref={audioRef} preload="auto" />

      {/* The header is shown from the start: the server clock may already be
          running while the audio downloads, and hiding it would hide that. */}
      <ExamHeader
        type={"listening"}
        noteSources={noteSources}
        onJumpToNote={handleJumpToNote}
        saveDraft={saveNow}
        draftSavedAt={savedAt}
      />

      <Content
        className="exam-body"
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {renderStage()}
      </Content>

      {examStarted && (
        <ExamFooter selectPart={selectPart} setSelectPart={setSelectPart} />
      )}
    </Layout>
  );
};

export default ListeningExam;
