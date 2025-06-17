import React, { useCallback, useMemo, useState } from "react";
import { createEditor, Element as SlateElement, Transforms } from "slate";
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
import { Modal, Progress } from "antd";
import apiClient from "../../services/api";

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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const handlePaste = (editor, event) => {
    const clipboardData = event.clipboardData;
    const items = clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log("Working: ", item);
      
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          insertImage(file)
        }
      }
    }
  };

  const insertImage = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "PHOTOS");
    try {
      const response = await apiClient.post("api/v1/file/photo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const { loaded, total } = progressEvent;
          const percentCompleted = Math.round((loaded / total) * 100);
          setUploadProgress(percentCompleted);
        },
      });

      const image = {
        type: "image",
        url: response.data.url,
        children: [{ text: "" }],
      };
      Transforms.insertNodes(editor, image);
      Transforms.insertNodes(editor, {
        type: "paragraph",
        children: [{ text: "" }],
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div>
      <Modal
        open={uploading}
        footer={null}
        closable={false}
        centered
        title="Uploading Image..."
        style={{ textAlign: "center" }}
      >
        <Progress
          type="circle"
          percent={uploadProgress}
          status={uploadProgress == 100 ? "success" : "active"}
        />
      </Modal>
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
          <Toolbar is_passage={is_passage} startInputId={startQuestionId} insertImage={insertImage} />
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
          onPaste={(event) => handlePaste(editor, event)}
        />
      </Slate>
    </div>
  );
};

export default RichTextEditor;
