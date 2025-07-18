import React, { useEffect, useState } from "react";
import { useSlateStatic, ReactEditor } from "slate-react";
import { Transforms } from "slate";
import { Input, Button, Card, Tooltip } from "antd";
import { DeleteOutlined, CloseOutlined } from "@ant-design/icons";

const MultipleChoiceElement = ({ attributes, children, element }) => {
  const editor = useSlateStatic();

  // Local state for question and options
  const [localQuestion, setLocalQuestion] = useState(element.question || "");
  const [localOptions, setLocalOptions] = useState(element.options || []);

  useEffect(() => {
    setLocalOptions(element.options || []);
  }, [element.options]);

  useEffect(() => {
    setLocalQuestion(element.question || "");
  }, [element.question]);

  const handleQuestionChange = (e) => {
    setLocalQuestion(e.target.value); // Update local state only
  };

  const handleQuestionBlur = () => {
    const path = ReactEditor.findPath(editor, element);
    Transforms.setNodes(editor, { question: localQuestion }, { at: path }); // Update Slate state on blur
  };

  const handleOptionChange = (index, e) => {
    const newOptions = [...localOptions];
    newOptions[index] = e.target.value;
    setLocalOptions(newOptions); // Update local state only
  };

  const handleOptionBlur = (index) => {
    const path = ReactEditor.findPath(editor, element);
    Transforms.setNodes(editor, { options: localOptions }, { at: path }); // Update Slate state on blur
  };

  const addOption = () => {
    const newOptions = [...localOptions, ""];
    setLocalOptions(newOptions); // Update local state
    const path = ReactEditor.findPath(editor, element);
    Transforms.setNodes(editor, { options: newOptions }, { at: path }); // Update Slate state
  };

  const removeOption = (index) => {
    const newOptions = localOptions.filter((_, i) => i !== index);
    setLocalOptions(newOptions); // Update local state
    const path = ReactEditor.findPath(editor, element);
    Transforms.setNodes(editor, { options: newOptions }, { at: path }); // Update Slate state
  };

  const removeThisElement = () => {
    const path = ReactEditor.findPath(editor, element);
    Transforms.removeNodes(editor, { at: path });
  };

  return (
    <div style={{ position: "relative" }} {...attributes}>
      <Card
        id={"ques-" + element.id}
        style={{
          margin: "10px 0",
          padding: "10px",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <Button
          size="small"
          type="text"
          icon={<CloseOutlined />}
          onClick={removeThisElement}
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            zIndex: 10,
            color: "#999",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: 16,
          }}
        >
          <span style={{ fontWeight: 500, whiteSpace: "nowrap" }}>
            {element.id}.
          </span>
          <Input
            value={localQuestion}
            onChange={handleQuestionChange} // Update local state only
            onBlur={handleQuestionBlur} // Update Slate state on blur
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="Enter your question here..."
            style={{ flex: 1 }}
          />
        </div>

        {/* Options */}
        {localOptions.map((option, index) => (
          <div
            key={index}
            style={{
              marginBottom: "8px",
              display: "flex",
              gap: "8px",
              alignItems: "center",
            }}
          >
            <span style={{ width: 20, fontWeight: 700 }}>
              {String.fromCharCode(65 + index)}.
            </span>
            <Input
              value={option}
              onChange={(event) => handleOptionChange(index, event)} // Update local state only
              onBlur={() => handleOptionBlur(index)} // Update Slate state on blur
              onKeyDown={(e) => e.stopPropagation()}
              style={{ flex: 1 }}
              placeholder={`Option ${index + 1}`}
            />
            <Tooltip title="Remove option">
              <Button
                icon={<DeleteOutlined />}
                danger
                onClick={() => removeOption(index)}
              />
            </Tooltip>
          </div>
        ))}

        {/* Add Option Button */}
        <Button type="dashed" onClick={addOption} style={{ marginTop: "10px" }}>
          Add Option
        </Button>
      </Card>
      {children}
    </div>
  );
};

export default MultipleChoiceElement;
