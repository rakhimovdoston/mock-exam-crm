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
  const BUFFER_TIME = 270; // extra time after all audios
  const REVIEW_TIME = 120;
  const dispatch = useDispatch();
  const [selectPart, setSelectPart] = useState();
  const [audios, setAudios] = useState([]);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const audioRef = useRef(null);
  const [audioDurations, setAudioDurations] = useState([]);
  const { data, error, loading } = useApiRequest(
    `api/v1/exam/module/${id}?moduleType=listening`
  );

  const [selectionText, setSelectionText] = useState("");
  const [menuPosition, setMenuPosition] = useState(null);

  const handleMouseUp = (e) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) {
      setMenuPosition(null);
      return;
    }

    const text = selection.toString();
    if (!text) {
      setMenuPosition(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Agar rect noto‘g‘ri bo‘lsa (0,0 yoki -1), menyuni ko‘rsatmaymiz
    if (rect.width === 0 && rect.height === 0) {
      setMenuPosition(null);
      return;
    }

    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const preferAbove = spaceAbove > 60;

    const top = preferAbove
      ? rect.top + window.scrollY - 50
      : rect.bottom + window.scrollY + 10;

    const left = Math.min(rect.left + window.scrollX, window.innerWidth - 150);

    setSelectionText(text);
    setMenuPosition({ top, left });
  };
  // mouse up
  useEffect(() => {}, []);

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
        ["c", "v", "x", "a", "s", "p", "r", "t"].includes(e.key.toLowerCase())
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

    const handlePaste = (e) => {
      e.preventDefault();
      toast.info(`Paste is blocked:`);
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      toast.info("Context Menu bloklangan:");
    };

    const handleCopy = (e) => {
      e.preventDefault();
      toast.info(`Copy is Blocked:`);
    };

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("copy", handleCopy);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("mouseup", handleMouseUp)
    };
  }, []);

  useEffect(() => {
    if (audios.length === 0 || !audioRef.current) return;

    if (currentAudioIndex >= audios.length) return;

    const audioEl = audioRef.current;
    audioEl.src = audios[currentAudioIndex];
    console.log(
      "Playing audio: ",
      audios[currentAudioIndex],
      " currentIndex: ",
      currentAudioIndex
    );

    audioEl.play().catch((err) => console.error("Audio playback failed:", err));
    const handleEnded = () => {
      setTimeout(() => {
        setCurrentAudioIndex((prev) => prev + 1);
      }, 30000);
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
    console.log("Total count: ", loadedCount);
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

  const highlightSelection = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    const container =
      range.commonAncestorContainer.nodeType === 3
        ? range.commonAncestorContainer.parentElement
        : range.commonAncestorContainer;

    // 🔍 check if already highlighted somewhere inside selection
    const highlightedAncestor = container.closest(".highlighted-text");

    if (highlightedAncestor) {
      // 🔄 Unhighlight (remove span, but keep inner HTML)
      const unwrapped = document.createDocumentFragment();
      while (highlightedAncestor.firstChild) {
        unwrapped.appendChild(highlightedAncestor.firstChild);
      }
      highlightedAncestor.replaceWith(unwrapped);
    } else {
      // ✅ Add highlight
      const span = document.createElement("span");
      span.className = "highlighted-text";
      span.style.backgroundColor = "yellow";

      try {
        const contents = range.cloneContents();
        span.appendChild(contents);
        range.deleteContents();
        range.insertNode(span);
      } catch (err) {
        console.error("Highlight error:", err);
        alert("Highlight failed — select fully formatted part.");
      }
    }

    selection.removeAllRanges();
    setMenuPosition(null);
  };

  return (
    <Layout style={{ position: "relative", height: "100vh" }}>
      <ExamHeader
        type={"listening"}
        totalExamTimeInSeconds={
          Math.ceil(audioDurations.reduce((sum, dur) => sum + dur, 0)) +
          BUFFER_TIME +
          REVIEW_TIME
        }
      />
      <Content style={{ padding: "40px", overflowY: "auto" }}>
        <div
          onMouseUp={handleMouseUp}
          style={{
            position: "relative",
            flex: 1,
            overflowY: "auto",
          }}
        >
          <audio ref={audioRef} autoPlay />

          {/* ALL PARTS */}
          {data?.data?.map((part) => (
            <div
              key={part.type}
              style={{
                display: selectPart === part.type ? "block" : "none",
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

          {/* Highlight menu */}
          {menuPosition && (
            <div
              style={{
                position: "absolute",
                top: menuPosition.top - 50,
                left: menuPosition.left,
                background: "#fff",
                borderRadius: "5px",
                zIndex: 1000,
                boxShadow: "0 2px 8px rgba(2, 23, 255, 0.55)",
              }}
            >
              <button onClick={highlightSelection} style={{ fontSize: "12px" }}>
                Highlight
              </button>
            </div>
          )}
        </div>
      </Content>

      <ExamFooter selectPart={selectPart} setSelectPart={setSelectPart} />
    </Layout>
  );
};

export default ListeningExam;
