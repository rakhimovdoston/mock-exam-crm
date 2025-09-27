import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import useApiRequest from "../../hooks/useApiRequest";
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
  const [audios, setAudios] = useState([]);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const audioRef = useRef(null);
  const [audioDurations, setAudioDurations] = useState([]);
  const { data, error, loading } = useApiRequest(
    `api/v1/exam/module/${id}?moduleType=listening`
  );

  // data download from api and set
  useEffect(() => {
    if (data?.data && data.data.length > 0) {
      dispatch(initilalizeExam(data.data));
      setSelectPart(data.data[0].type);
      setAudios(data?.data.map((dat) => dat.audio));
    }
  }, [data]);

  // before unload
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl yoki Meta (Mac uchun ⌘) bilan bosilgan tugmalarni bloklash
      if (
        (e.ctrlKey || e.metaKey) &&
        ["s", "p", "r", "t"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        toast.info(`This keyboard blocked:`);
      }

      // F12 (developer tools), PrintScreen, va boshqalarni ham bloklash mumkin
      if (e.key === "F12" || e.key === "PrintScreen") {
        e.preventDefault();
        toast.info(`This keyboard blocked:`);
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      toast.info("Context Menu bloklangan:");
    };

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  useEffect(() => {
    if (audios.length === 0 || !audioRef.current) return;

    if (currentAudioIndex >= audios.length) return;

    const audioEl = audioRef.current;
    audioEl.src = audios[currentAudioIndex];

    audioEl.play().catch((err) => console.error("Audio playback failed:", err));
    const handleEnded = () => {
      setTimeout(() => {
        setCurrentAudioIndex((prev) => prev + 1);
      }, 3000);
    };

    audioEl.addEventListener("ended", handleEnded);

    return () => {
      audioEl.removeEventListener("ended", handleEnded);
    };
  }, [currentAudioIndex, audios]);

  useEffect(() => {
    if (!audios || audios.length === 0) return;

    let loadedCount = 0;
    const durations = [];

    audios.forEach((src, index) => {
      const audio = new Audio();
      audio.src = src;

      audio.onloadedmetadata = () => {
        durations[index] = audio.duration;
        loadedCount++;

        if (loadedCount === audios.length) {
          setAudioDurations(durations);
        }
      };

      audio.onerror = () => {
        console.error("Failed to load audio: ", src);
        durations[index] = 0;
        loadedCount++;

        if (loadedCount === audios.length) {
          setAudioDurations(durations);
        }
      };
    });
  }, [audios]);

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
        totalExamTimeInSeconds={
          Math.ceil(audioDurations.reduce((sum, dur) => sum + dur, 0)) + 10
        }
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
