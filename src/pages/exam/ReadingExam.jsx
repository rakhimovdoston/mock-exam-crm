import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Layout, Spin, Splitter } from "antd";

import ExamHeader from "../../components/layouts/ExamHeader";
import ExamFooter from "../../components/layouts/ExamFooter";
import RichTextViewer from "../../components/editor/RichTextViewer";

import useApiRequest from "../../hooks/useApiRequest";
import { initilalizeExam } from "../../store/examReducer";
import {
  getNumberByPassageType,
  getPassageNumberByPassageType,
  getQuestionNumbers,
} from "../../utils";
import { toast } from "react-toastify";

const { Content } = Layout;

const ReadingExam = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [selectedPart, setSelectedPart] = useState(null);

  const [selectionText, setSelectionText] = useState("");
  const [menuPosition, setMenuPosition] = useState(null);

  const { data, loading, error } = useApiRequest(
    `api/v1/exam/module/${id}?moduleType=reading`
  );

  const examParts = data?.data || [];

  useEffect(() => {
    if (data && data.data) {
      setSelectedPart(data.data[0].type);
      dispatch(initilalizeExam(data.data));
    }
  }, [data]);

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
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("copy", handleCopy);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  if (loading) {
    return (
      <CenteredContainer>
        <Spin size="large" />
      </CenteredContainer>
    );
  }

  if (error || !examParts.length) {
    return (
      <CenteredContainer>
        <h2>Error loading exam data</h2>
      </CenteredContainer>
    );
  }

  const countListHeader = (content) => {
    let count = 0;
    for (const node of content) {
      if (node.type === "ordered-list") {
        count +=
          node.children?.filter((child) => child.type === "list-item").length ||
          0;
      }
    }
    return count;
  };

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
        toast.info("Highlight failed — select fully formatted part.");
      }
    }

    selection.removeAllRanges();
    setMenuPosition(null);
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
      <ExamHeader type="reading" />
      <Content
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          onMouseUp={handleMouseUp}
          style={{
            position: "relative",
            flex: 1,
            overflowY: "auto",
          }}
        >
          {examParts.map((part) => {
            return (
              <Splitter
                key={part.id}
                style={{
                  display: part.type == selectedPart ? "flex" : "none",
                  boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
                }}
              >
                <Splitter.Panel defaultSize="50%" min="40%" max="60%">
                  <div>
                    <h2 style={{ padding: "10px" }}>
                      Reading Passage{" "}
                      {getPassageNumberByPassageType(selectedPart)}
                    </h2>
                    <p
                      style={{
                        padding: "0 10px",
                        fontStyle: "italic",
                        fontSize: "16px",
                        margin: 0,
                      }}
                    >
                      You should spend about 20 minutes on{" "}
                      <b>Questions {getNumberByPassageType(selectedPart)}</b>,
                      which are based on Reading Passage{" "}
                      {getPassageNumberByPassageType(selectedPart)} below.
                    </p>
                    <RichTextViewer content={part.content} type={""} />
                  </div>
                </Splitter.Panel>
                <Splitter.Panel style={{ padding: "10px" }}>
                  {part.questions.map((question) => (
                    <div key={question.id}>
                      <p
                        style={{
                          fontSize: "20px",
                          fontWeight: "bold",
                          color: "#1677ff",
                        }}
                      >
                        Questions {getQuestionNumbers(question)}
                      </p>
                      <RichTextViewer
                        headings={countListHeader(part.content)}
                        content={question.content}
                        type={question.type}
                      />
                    </div>
                  ))}
                </Splitter.Panel>
              </Splitter>
            );
          })}

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
      <ExamFooter
        types={examParts.map((part) => part.type)}
        selectPart={selectedPart}
        setSelectPart={setSelectedPart}
      />
    </Layout>
  );
};

const CenteredContainer = ({ children }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
    }}
  >
    {children}
  </div>
);

export default ReadingExam;
