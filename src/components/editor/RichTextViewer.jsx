import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import ReactDOM from "react-dom";
import { createEditor, Node } from "slate";
import { withHistory } from "slate-history";
import { Editable, ReactEditor, Slate, withReact } from "slate-react";
import TableRowElement from "./elements/TableRowElement";
import TableCellElement from "./elements/TableCellElement";
import ImageElement from "./elements/ImageElement";
import InputElement from "./elements/InputElement";
import OrderedListElement from "./elements/OrderedListElement";
import UnorderedListElement from "./elements/UnorderedListElement";
import SpanElement from "./elements/SpanElement";
import ParagraphElement from "./elements/ParagraprhElement";
import ReadOnlyMultipleChoiceElement from "./elements/ReadOnlyMultipleChoiceElement";
import Leaf from "./elements/Leaf";
import DefaultElement from "./elements/DefaultElement";
import MultipleChoiceMultipleAnswerElement from "./elements/MultipleChoiceMultipleAnswerElement";
import TableElementViewer from "./elements/TableElementViewer";
import ListItemViewElement from "./elements/view/ListItemViewElement";
import { canDragAndDrop, toggleFormat } from "./editorUtils";
import { getStartByQuestionType } from "../../utils";
import { DragProvider } from "./contexts/DragContext";
import { updateAnswer } from "../../store/answerReducer";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { updateForUserAnswers } from "../../store/examReducer";
import { Button, Flex, Tooltip } from "antd";
import MultipleChoiceOptionElement from "./elements/view/MultipleChoiceOptionElement";
import CheckboxViewElement from "./elements/view/CheckboxViewElement";
import "../../styles/exam.css";

const HIGHLIGHT_COLORS = [
  { value: "#FFE58F", label: "Yellow" },
  { value: "#BAE0FF", label: "Blue" },
  { value: "#B7EB8F", label: "Green" },
  { value: "#FFCCC7", label: "Red" },
];

const initialValue = [
  {
    type: "paragraph",
    children: [
      { text: "Something went wrong, please report it to the reviewer." },
    ],
  },
];

const convertMultipleChoiceToSlateFriendly = (content) => {
  return content.map((node) => {
    if (
      (node.type === "multiple-choice" ||
        node.type === "multiple-choice-multiple-answer") &&
      node.question &&
      node.options
    ) {
      const id = node.id;
      const questionParagraph = {
        type: "span",
        id: id,
        questionNumber: node.questionNumber,
        startInputId: node.startInputId,
        children: [{ text: node.question }],
      };

      const optionNodes = node.options.map((opt) => ({
        type:
          node.type === "multiple-choice-multiple-answer"
            ? "checkbox"
            : "option",
        id: id,
        questionNumber: node.questionNumber,
        startInputId: node.startInputId,
        optionValue: opt,
        children: [{ text: opt }],
      }));

      return {
        ...node,
        question: undefined,
        options: undefined,
        children: [questionParagraph, ...optionNodes],
      };
    }

    if (Array.isArray(node.children)) {
      return {
        ...node,
        children: convertMultipleChoiceToSlateFriendly(node.children),
      };
    }

    return node;
  });
};

function injectSelectoptions(nodes) {
  const extractOptionsFromList = (node) => {
    if (
      node.type === "ordered-list" &&
      node.listStyleType === "upper-alpha" &&
      Array.isArray(node.children)
    ) {
      return node.children
        .filter((child) => child.type === "list-item")
        .map((child, index) => ({
          key: Node.string(child),
          value: String.fromCharCode(65 + index),
        }));
    }
    return null;
  };

  let headingOptions = [];

  const findHeadingList = (nodes) => {
    for (const node of nodes) {
      if (!node || typeof node !== "object") continue;

      const options = extractOptionsFromList(node);

      if (options) {
        headingOptions = options;
        break;
      }

      if (node.children) {
        findHeadingList(node.children);
      }
    }
  };

  findHeadingList(nodes);
  return headingOptions;
}

function injectHeadingOptions(content, headings, type) {
  const headOptions = [];
  if (
    (headings && type === "Matching Headings") ||
    type === "Matching Information"
  ) {
    for (let i = 0; i < headings; i++) {
      headOptions.push({
        key: String.fromCharCode(65 + i),
        value: String.fromCharCode(65 + i),
      });
    }
  } else if (type === "True/False/Not Given" || type === "Yes/No/Not Given") {
    if (type === "Yes/No/Not Given") {
      headOptions.push(
        { key: "Yes", value: "Yes" },
        { key: "No", value: "No" },
        { key: "Not Given", value: "Not Given" }
      );
    } else
      headOptions.push(
        { key: "True", value: "True" },
        { key: "False", value: "False" },
        { key: "Not Given", value: "Not Given" }
      );
  }

  const headingOptions =
    headOptions.length > 0
      ? headOptions
      : injectSelectoptions(content || initialValue);

  const inject = (nodes) => {
    return nodes.map((node) => {
      if (node.type === "list-item") {
        return {
          ...node,
          headingOptions: headingOptions,
          questionsType: type,
        };
      }

      if (node.children) {
        return {
          ...node,
          children: inject(node.children),
        };
      }

      return node;
    });
  };

  return inject(content);
}

const RichTextViewer = ({
  content,
  headings,
  type,
  is_passage = false,
  difficultType = "default",
}) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { size } = useSelector((state) => state.app);
  const adminAnswers = useSelector((state) => state.answer.answers);
  const examAnswers = useSelector((state) => state.exam.answers);

  const editor = useMemo(() => {
    const baseEditor = withHistory(withReact(createEditor()));
    const originalIsInline = baseEditor.isInline;

    baseEditor.isInline = (element) => {
      return (
        element.type === "input" ||
        (originalIsInline ? originalIsInline(element) : false)
      );
    };

    return baseEditor;
  }, []);

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

    setMenuPosition({ top, left });
  };

  const renderElement = useCallback((props) => {
    const checkDragAndDrop = canDragAndDrop(content, type);
    const path = ReactEditor.findPath(editor, props.element);
    const index = path[path.length - 1];
    switch (props.element.type) {
      case "table":
        return <TableElementViewer {...props} />;
      case "table-row":
        return <TableRowElement {...props} />;
      case "table-cell":
        return <TableCellElement {...props} />;
      case "image":
        return <ImageElement {...props} />;
      case "input":
        return <InputElement {...props} dragAndDrop={checkDragAndDrop} />;
      case "ordered-list":
        return <OrderedListElement {...props} is_passage={is_passage} />;
      case "unordered-list":
        return (
          <UnorderedListElement
            {...props}
            is_passage={is_passage}
            type={type}
            dragAndDrop={checkDragAndDrop}
          />
        );
      case "list-item":
        return (
          <ListItemViewElement
            {...props}
            is_passage={is_passage}
            index={index}
            startQuestionNumber={getStartByQuestionType(difficultType) + 1}
            dragAndDrop={checkDragAndDrop}
            type={type}
          />
        );
      case "span":
        return <SpanElement {...props} />;
      case "paragraph":
        return <ParagraphElement {...props} />;
      case "multiple-choice-multiple-answer":
        return <MultipleChoiceMultipleAnswerElement {...props} />;
      case "multiple-choice":
        return <ReadOnlyMultipleChoiceElement {...props} />;
      case "option":
        return <MultipleChoiceOptionElement {...props} />;
      case "checkbox":
        return <CheckboxViewElement {...props} />;
      default:
        return <DefaultElement {...props} />;
    }
  }, []);

  const renderLeaf = useCallback((props) => {
    return <Leaf {...props} />;
  }, []);

  const preparedContent = useMemo(() => {
    const converted = convertMultipleChoiceToSlateFriendly(
      content || initialValue
    );
    return injectHeadingOptions(converted, headings, type);
  }, [content, headings]);

  const isAnswerKeyMode = location.pathname.includes("/dashboard/ielts");

  const setAnswerValue = useCallback(
    (key, value) => {
      if (isAnswerKeyMode) {
        dispatch(updateAnswer({ key, value }));
      } else {
        dispatch(updateForUserAnswers({ key, value }));
      }
    },
    [dispatch, isAnswerKeyMode]
  );

  // A word bank belongs to one part, so a moved answer is only cleared from
  // slots inside that same part — never from a typed answer elsewhere.
  const getScopeFor = useCallback(
    (key) => {
      if (isAnswerKeyMode) return adminAnswers;
      const part = examAnswers.find((item) =>
        (item.answers || []).some((answer) => answer.key === key)
      );
      return part ? part.answers : [];
    },
    [isAnswerKeyMode, adminAnswers, examAnswers]
  );

  const onDropAnswer = useCallback(
    (key, value, fromKey = null) => {
      if (fromKey != null && fromKey === key) return;

      // One bank item can only sit in one slot: free the slot that holds it.
      const previous = getScopeFor(key).find(
        (answer) =>
          answer.key !== undefined && answer.key !== key && answer.value === value
      );
      if (previous) setAnswerValue(previous.key, "");

      setAnswerValue(key, value);
    },
    [getScopeFor, setAnswerValue]
  );

  const onClearAnswer = useCallback(
    (key) => setAnswerValue(key, ""),
    [setAnswerValue]
  );

  return (
    <div
      style={{
        minHeight: "100px",
        maxHeight: is_passage ? "calc(100vh - 250px)" : "100%",
        overflowY: "auto",
        boxSizing: "border-box",
      }}
      onMouseUp={handleMouseUp}
    >
      <DragProvider onDropAnswer={onDropAnswer} onClearAnswer={onClearAnswer}>
        <Slate
          key={JSON.stringify(content)}
          editor={editor}
          initialValue={preparedContent}
        >
          {menuPosition &&
            ReactDOM.createPortal(
              <div
                style={{
                  position: "absolute",
                  top: `${menuPosition.top}px`,
                  left: menuPosition.left,
                  background: "var(--exam-surface)",
                  border: "1px solid var(--exam-border)",
                  borderRadius: 10,
                  zIndex: 1000,
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.18)",
                }}
              >
                <Flex align="center" gap={6} style={{ padding: 6 }}>
                  {HIGHLIGHT_COLORS.map((color) => (
                    <Tooltip key={color.value} title={color.label}>
                      <button
                        type="button"
                        aria-label={color.label}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          toggleFormat(editor, "highlight", color.value);
                          setMenuPosition();
                        }}
                        style={{
                          width: 24,
                          height: 24,
                          padding: 0,
                          borderRadius: 6,
                          cursor: "pointer",
                          border: "1px solid rgba(16, 24, 40, 0.12)",
                          background: color.value,
                        }}
                      />
                    </Tooltip>
                  ))}
                  <Tooltip title="Clear highlight">
                    <Button
                      size="small"
                      type="text"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        toggleFormat(editor, "highlight", "transparent");
                        setMenuPosition();
                      }}
                    >
                      Clear
                    </Button>
                  </Tooltip>
                </Flex>
              </div>,
              document.body
            )}

          <Editable
            style={{
              padding: "0 10px",
              fontSize: `${size}px`,
              border: "none",
              overflowY: "auto",
              borderRadius: "4px",
              minHeight: "50px",
              maxHeight: "100%",
            }}
            autoFocus
            readOnly={true}
            placeholder="Type something..."
            renderElement={renderElement}
            renderLeaf={renderLeaf}
          />
        </Slate>
      </DragProvider>
    </div>
  );
};
export default RichTextViewer;
