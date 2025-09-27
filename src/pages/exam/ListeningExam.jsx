import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import useApiRequest from "../../hooks/useApiRequest";
import useExamSecurity from "../../hooks/useExamSecurity";
import { useDispatch } from "react-redux";
import { Layout, Spin } from "antd";
import ExamFooter from "../../components/layouts/ExamFooter";
import ExamHeader from "../../components/layouts/ExamHeader";
import RichTextViewer from "../../components/editor/RichTextViewer";
import { getQuestionNumbers } from "../../utils";
import { initilalizeExam } from "../../store/examReducer";
import { toast } from "react-toastify";

const { Content } = Layout;

const ListeningExam = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [selectPart, setSelectPart] = useState();
  const [audios, setAudios] = useState(null);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const audioRef = useRef(null);
  const playbackDelayTimeout = useRef(null);
  const playbackRetryTimeout = useRef(null);
  const playbackRetryRef = useRef(0);
  const [audioDurations, setAudioDurations] = useState([]);
  const [isTimerReady, setIsTimerReady] = useState(false);
  const { data, error, loading } = useApiRequest(
    `api/v1/exam/module/${id}?moduleType=listening`
  );
  const metadataErrorCache = useRef(new Set());
  const metadataAttemptRef = useRef(0);
  const metadataRetryTimeoutRef = useRef(null);

  useExamSecurity();

  // data download from api and set
  useEffect(() => {
    if (data?.data) {
      dispatch(initilalizeExam(data.data));
      setSelectPart(data.data[0]?.type);
      setAudios(data.data.map((dat) => dat.audio));
      setCurrentAudioIndex(0);
      setIsTimerReady(false);
    }
  }, [data]);

  useEffect(() => {
    if (!audios || audios.length === 0 || !audioRef.current) return;
    if (currentAudioIndex >= audios.length) return;

    const audioEl = audioRef.current;
    const src = audios[currentAudioIndex];
    const MAX_RETRY_COUNT = 3;
    let isCancelled = false;

    audioEl.crossOrigin = "anonymous";

    playbackRetryRef.current = 0;

    const clearDelayTimeout = () => {
      if (playbackDelayTimeout.current) {
        clearTimeout(playbackDelayTimeout.current);
        playbackDelayTimeout.current = null;
      }
    };

    const clearRetryTimeout = () => {
      if (playbackRetryTimeout.current) {
        clearTimeout(playbackRetryTimeout.current);
        playbackRetryTimeout.current = null;
      }
    };

    const resetRetries = () => {
      playbackRetryRef.current = 0;
      clearRetryTimeout();
    };

    const scheduleRetry = () => {
      if (isCancelled) return;
      if (playbackRetryRef.current >= MAX_RETRY_COUNT) {
        toast.error("Audio playback failed. Please check your connection.");
        return;
      }

      playbackRetryRef.current += 1
      const retryDelay = playbackRetryRef.current * 1000;

      clearRetryTimeout();

      playbackRetryTimeout.current = window.setTimeout(() => {
        if (isCancelled || !audioRef.current || audioRef.current !== audioEl) {
          return;
        }

        audioEl.load();
        playWithRetry();
      }, retryDelay);
    };

    const playWithRetry = () => {
      if (isCancelled) return;

      audioEl
        .play()
        .then(() => {
          resetRetries();
        })
        .catch((err) => {
          console.error("Audio playback failed:", err);
          scheduleRetry();
        });
    };

    audioEl.pause();
    audioEl.currentTime = 0;
    audioEl.src = src;
    audioEl.load();
    playWithRetry();

    const handleLoadedMetadataFromPlayback = () => {
      const measuredDuration = Number.isFinite(audioEl.duration)
        ? audioEl.duration
        : 0;

      if (!measuredDuration || measuredDuration <= 0) {
        return;
      }

      setAudioDurations((prevDurations) => {
        if (!Array.isArray(prevDurations) || !audios) {
          return prevDurations;
        }

        if (prevDurations.length !== audios.length) {
          return prevDurations;
        }

        if (prevDurations[currentAudioIndex] > 0) {
          return prevDurations;
        }

        const nextDurations = [...prevDurations];
        nextDurations[currentAudioIndex] = measuredDuration;
        return nextDurations;
      });
    };

    const handleEnded = () => {
      resetRetries();
      clearDelayTimeout();
      playbackDelayTimeout.current = window.setTimeout(() => {
        if (!isCancelled) {
          setCurrentAudioIndex((prev) => prev + 1);
        }
      }, 3000);
    };

    const handleStalled = () => {
      scheduleRetry();
    };

    const handleError = () => {
      scheduleRetry();
    };

    audioEl.addEventListener("ended", handleEnded);
    audioEl.addEventListener("stalled", handleStalled);
    audioEl.addEventListener("error", handleError);
    audioEl.addEventListener("loadedmetadata", handleLoadedMetadataFromPlayback);

    return () => {
      isCancelled = true;
      clearDelayTimeout();
      clearRetryTimeout();
      audioEl.removeEventListener("ended", handleEnded);
      audioEl.removeEventListener("stalled", handleStalled);
      audioEl.removeEventListener("error", handleError);
      audioEl.removeEventListener(
        "loadedmetadata",
        handleLoadedMetadataFromPlayback
      );
    };
  }, [currentAudioIndex, audios]);

  useEffect(() => {
    if (!audios) {
      setAudioDurations([]);
      setIsTimerReady(false);
      return;
    }

    if (audios.length === 0) {
      setAudioDurations([]);
      setIsTimerReady(true);
      return;
    }

    let isCancelled = false;
    setAudioDurations([]);
    setIsTimerReady(false);
    metadataAttemptRef.current = 0;
    metadataErrorCache.current.clear();

    const clearMetadataRetryTimeout = () => {
      if (metadataRetryTimeoutRef.current) {
        clearTimeout(metadataRetryTimeoutRef.current);
        metadataRetryTimeoutRef.current = null;
      }
    };

    const loadMetadataOnce = (src, attempt) =>
      new Promise((resolve) => {
        const audio = new Audio();
        audio.preload = "auto";
        audio.crossOrigin = "anonymous";
        const cacheBustingSrc =
          attempt > 1
            ? `${src}${src.includes("?") ? "&" : "?"}retry=${attempt}`
            : src;
        audio.src = cacheBustingSrc;

        const finalize = (payload) => {
          audio.src = "";
          resolve(payload);
        };

        const timeoutId = window.setTimeout(() => finalize({ success: false }), 8000);

        audio.onloadedmetadata = () => {
          clearTimeout(timeoutId);
          finalize({ success: true, duration: audio.duration || 0 });
        };

        audio.onerror = () => {
          clearTimeout(timeoutId);
          finalize({ success: false });
        };

        audio.load();
      });

    const loadDurationsSequentially = async () => {
      clearMetadataRetryTimeout();
      metadataAttemptRef.current += 1;
      const currentAttempt = metadataAttemptRef.current;
      const durations = new Array(audios.length).fill(0);

      for (let index = 0; index < audios.length; index += 1) {
        const src = audios[index];

        if (isCancelled) {
          break;
        }

        if (!src) {
          durations[index] = 0;
          continue;
        }

        // Load metadata one-by-one to avoid hammering the server under heavy load.
        let attempt = 1;
        const MAX_METADATA_ATTEMPTS = 3;
        let success = false;

        while (!success && attempt <= MAX_METADATA_ATTEMPTS && !isCancelled) {
          // eslint-disable-next-line no-await-in-loop
          const result = await loadMetadataOnce(src, attempt);

          if (result.success && Number.isFinite(result.duration)) {
            durations[index] = result.duration;
            success = true;
          } else {
            attempt += 1;

            if (attempt <= MAX_METADATA_ATTEMPTS) {
              // eslint-disable-next-line no-await-in-loop
              await new Promise((resolve) =>
                window.setTimeout(resolve, attempt * 300)
              );
            }
          }
        }

        if (!success) {
          durations[index] = 0;

          if (!metadataErrorCache.current.has(src)) {
            metadataErrorCache.current.add(src);
            console.warn("Fallback used for audio metadata:", src);
          }
        }
      }

      if (!isCancelled) {
        setAudioDurations(durations);

        const hasFullDurations = durations.every((duration) => duration > 0);

        if (hasFullDurations) {
          setIsTimerReady(true);
        } else if (currentAttempt < 3) {
          metadataRetryTimeoutRef.current = window.setTimeout(() => {
            if (!isCancelled) {
              loadDurationsSequentially();
            }
          }, 1500);
        } else {
          // Start timer with best available sum after capped retries.
          setIsTimerReady(true);
        }
      }
    };

    loadDurationsSequentially();

    return () => {
      isCancelled = true;
      clearMetadataRetryTimeout();
    };
  }, [audios]);

  useEffect(() => {
    if (!audios || audioDurations.length !== audios.length) {
      return;
    }

    if (audioDurations.every((duration) => duration > 0)) {
      setIsTimerReady(true);
    }
  }, [audios, audioDurations]);

  const totalListeningTime = audioDurations.length
    ? Math.ceil(audioDurations.reduce((sum, dur) => sum + dur, 0)) + 10
    : 0;

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
        <h2>Error loading exam data</h2>
      </div>
    );
  }

  return (
    <Layout
      style={{
        position: "relative",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ExamHeader
        type={"listening"}
        isTimerReady={isTimerReady}
        totalExamTimeInSeconds={totalListeningTime}
      />
      <Content style={{ padding: "40px", overflowY: "auto" }}>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
          }}
        >
          <audio ref={audioRef} autoPlay preload="auto" />

          {/* ALL PARTS */}
          {data?.data?.map((part) => (
            <div
              key={part.type}
              style={{
                display: selectPart === part.type ? "block" : "none",
                position: "relative",
              }}
            >
              {part.questions.map((question) => (
                <div key={question.id}>
                  <p style={{ fontSize: "20px", fontWeight: "bold" }}>
                    Questions {getQuestionNumbers(question)}
                  </p>
                  <RichTextViewer
                    content={question.content}
                    type={question.type}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </Content>

      <ExamFooter selectPart={selectPart} setSelectPart={setSelectPart} />
    </Layout>
  );
};

export default ListeningExam;
