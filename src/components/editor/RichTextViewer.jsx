import React, { useCallback, useMemo } from "react";
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
import { DragProvider } from "./contexts/DragContext";
import { useDispatch } from "react-redux";
import { updateAnswer } from "../../store/answerReducer";

const initialValue = [
  {
    type: "paragraph",
    children: [
      { text: "Something went wrong, please report it to the reviewer." },
    ],
  },
];

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

const RichTextViewer = ({ content, headings, type, is_passage = false }) => {
  const editor = useMemo(() => {
    const baseEditor = withHistory(withReact(createEditor()));
    const originalIsInline = baseEditor.isInline; // Save the original method

    baseEditor.isInline = (element) => {
      return (
        element.type === "input" ||
        (originalIsInline ? originalIsInline(element) : false)
      );
    };

    return baseEditor;
  }, []);

  const dispatch = useDispatch();

  const renderElement = useCallback((props) => {
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
        return <InputElement {...props} />;
      case "ordered-list":
        return <OrderedListElement {...props} />;
      case "unordered-list":
        return <UnorderedListElement {...props} />;
      case "list-item":
        return (
          <ListItemViewElement
            {...props}
            is_passage={is_passage}
            index={index}
            startQuestionNumber={1}
          />
        );
      case "span":
        return <SpanElement {...props} />;
      case "paragraph":
        return <ParagraphElement {...props} />;
      case "multiple-choice":
        return <ReadOnlyMultipleChoiceElement {...props} />;
      case "multiple-choice-multiple-answer":
        return <MultipleChoiceMultipleAnswerElement {...props} />;
      default:
        return <DefaultElement {...props} />;
    }
  }, []);

  const renderLeaf = useCallback((props) => {
    return <Leaf {...props} />;
  }, []);

  const preparedContent = useMemo(() => {
    return injectHeadingOptions(content || initialValue, headings, type);
  }, [content, headings]);

  const onDropAnswer = (key, value) => {
    console.log("Drop Answer", key, value);

    dispatch(updateAnswer({ key, value }));
  };

  return (
    <div
      style={{
        minHeight: "100px",
        maxHeight: is_passage ? "calc(100vh - 250px)" : "100%",
        overflowY: "auto",
        boxSizing: "border-box",
      }}
    >
      <DragProvider onDropAnswer={onDropAnswer}>
        <Slate
          key={JSON.stringify(content)}
          editor={editor}
          initialValue={preparedContent}
        >
          <Editable
            style={{
              padding: "0 10px",
              fontSize: "16px",
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
