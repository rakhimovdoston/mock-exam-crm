import React, { useCallback, useMemo, useState } from "react";
import { createEditor, Element as SlateElement } from "slate";
import { Slate, Editable, withReact } from "slate-react";
import { withHistory } from "slate-history";
import Toolbar from "./Toolbar";
import InputElement from "./elements/InputElement";
import TableElement from "./elements/TableElement";
import ImageElement from "./elements/ImageElement";
import Leaf from "./elements/Leaf";
import DefaultElement from "./elements/DefaultElement";
import SpanElement from "./elements/SpanElement";
import ListItemElement from "./elements/ListItemElement";
import UnorderedListElement from "./elements/UnorderedListElement";
import OrderedListElement from "./elements/OrderedListElement";
import TableCellElement from "./elements/TableCellElement";
import TableRowElement from "./elements/TableRowElement";
import { handleKeyDown } from "./editorUtils";
import ParagraphElement from "./elements/ParagraprhElement";
import MultipleChoiceElement from "./elements/MultipleChoiceElement";
import MultipleChoiceMultipleAnswerElement from "./elements/MultipleChoiceMultipleAnswerElement";

const initialValue = [
  {
    type: "paragraph",
    children: [{ text: "" }],
  },
];

const RichTextEditor = ({
  is_passage,
  value,
  setValue,
  readonly = false,
  initValue,
  startQuestionId = 0,
}) => {
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

  const renderElement = useCallback((props) => {
    switch (props.element.type) {
      case "table":
        return <TableElement {...props} />;
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
        return <ListItemElement {...props} />;
      case "span":
        return <SpanElement {...props} />;
      case "paragraph":
        return <ParagraphElement {...props} />;
      case "multiple-choice":
        return <MultipleChoiceElement {...props} />;
      case "multiple-choice-multiple-answer":
        return <MultipleChoiceMultipleAnswerElement {...props} />;
      default:
        return <DefaultElement {...props} />;
    }
  }, []);

  const renderLeaf = useCallback((props) => {
    return <Leaf {...props} />;
  }, []);

  // const isFormatActive = (format) => {
  //   const marks = Editor.marks(editor);
  //   return marks ? marks[format] === true : false;
  // };

  // const toggleFormat = (format) => {
  //   const isActive = isFormatActive(format);
  //   if (isActive) {
  //     Editor.removeMark(editor, format);
  //   } else {
  //     Editor.addMark(editor, format, true);
  //   }
  // };

  // const handleKeyDown = (event) => {
  //   if (event.ctrlKey || event.metaKey) {
  //     switch (event.key.toLowerCase()) {
  //       case "b":
  //         event.preventDefault();
  //         toggleFormat("bold");
  //         break;
  //       case "i":
  //         event.preventDefault();
  //         toggleFormat("italic");
  //         break;
  //       case "u":
  //         event.preventDefault();
  //         toggleFormat("underline");
  //         break;
  //       default:
  //         break;
  //     }
  //   }

  //   if (event.key === "Tab") {
  //     event.preventDefault();
  //     Transforms.insertText(editor, "\t");
  //   }
  // };

  return (
    <div>
      <Slate
        editor={editor}
        key={JSON.stringify(readonly ? value : initValue || initialValue)}
        initialValue={readonly ? value : initValue || initialValue}
        value={value}
        onChange={(newValue) => {
          setValue(newValue);
        }}
      >
        {!readonly && (
          <Toolbar is_passage={is_passage} startInputId={startQuestionId} />
        )}
        <Editable
          style={{
            padding: "0 10px",
            fontSize: "16px",
            border: readonly ? "none" : "1px solid #ccc",
            minHeight: "350px",
            maxHeight: readonly ? "calc(100vh-200px)" : "530px",
            overflowY: "scroll",
            borderRadius: "4px",
          }}
          autoFocus
          readOnly={readonly}
          placeholder="Type something..."
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={(event) => handleKeyDown(editor, event)}
        />
      </Slate>
    </div>
  );
};

export default RichTextEditor;
