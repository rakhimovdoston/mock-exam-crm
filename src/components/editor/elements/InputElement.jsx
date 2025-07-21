import React, { useState, useEffect } from "react";
import { useSlateStatic, ReactEditor } from "slate-react";
import { Transforms } from "slate";
import { Button, Input, Modal, Select } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { updateAnswer } from "../../../store/answerReducer";
import { getValueFromAnswer } from "../../../utils";
import { updateForUserAnswers } from "../../../store/examReducer";
import { useLocation } from "react-router-dom";

const InputElement = ({
  attributes,
  element,
  children,
  view = true,
  dragAndDrop = false,
}) => {
  const location = useLocation();
  const editor = useSlateStatic();
  const path = ReactEditor.findPath(editor, element);
  const { answers } = useSelector((state) => state.answer);
  const userAnswers = useSelector((state) => state.exam);
  const inpValue = getValueFromAnswer(element.placeholder, answers);

  const [selectedValues, setSelectedValues] = useState(element.value || "");

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [inputValue, setInputValue] = useState(element.value || "");
  const dispatch = useDispatch();

  useEffect(() => {
    if (checkUrl()) {
      setSelectedValues(element.value || "");
    } else {
      setInputValue(element.value || "");
    }
  }, [element.value]);

  const handleChange = (e) => {
    setInputValue(e.target.value);
    const idNumber = parseInt(e.target.id.replace("ques-", ""), 10);
    if (answers.length > 0) {
      dispatch(updateAnswer({ key: idNumber, value: e.target.value }));
    } else {
      dispatch(updateForUserAnswers({ key: idNumber, value: e.target.value }));
    }
  };

  const handleBlur = () => {
    Transforms.setNodes(editor, { value: inputValue }, { at: path });
  };

  const getValue = () => {
    for (const anss of userAnswers.answers) {
      for (const ans of anss.answers) {
        if (ans.key === element.placeholder) return ans.value;
      }
    }
    return "";
  };

  const checkUrl = () => {
    return location.pathname.includes("/dashboard/ielts");
  };

  const handleSelectChange = (value) => {
    setSelectedValues(value.join("; "));
  };

  const handleModalOk = () => {
    const idNumber = parseInt(element.placeholder, 10);
    if (answers.length > 0) {
      dispatch(updateAnswer({ key: idNumber, value: selectedValues }));
    } else {
      dispatch(updateForUserAnswers({ key: idNumber, value: selectedValues }));
    }
    setSelectedValues(null);
    setIsModalOpen(false);
  };

  const handleDrop = (e, questionNumber) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("drag-item");
    if (data) {
      const dropped = JSON.parse(data);
      if (answers.length > 0) {
        dispatch(updateAnswer({ key: questionNumber, value: dropped.value }));
      } else {
        dispatch(
          updateForUserAnswers({ key: questionNumber, value: dropped.value })
        );
      }
    }
  };

  const getValueDragAndDrop = () => {
    if (answers.length > 0) {
      for (const ans of answers) {
        if (ans.key === element.placeholder) return ans.value;
      }
    } else {
      for (const examAnswer of userAnswers.answers) {
        for (const exAns of examAnswer.answers) {
          if (exAns.key === element.placeholder) {
            return exAns.value;
          }
        }
      }
    }
    return "";
  };

  if (dragAndDrop) {
    const questionNumber = parseInt(element.placeholder, 10);
    return (
      <div style={{ display: "inline-flex" }}>
        <div
          onDrop={(e) => handleDrop(e, questionNumber)}
          onDragOver={(e) => e.preventDefault()}
          // onDragEnter={handleDragEnter}
          // onDragLeave={handleDragLeave}
          style={{
            width: getValueDragAndDrop() ? "fit-content" : 100,
            minHeight: 10,
            border: `2px dashed #ccc`,
            borderRadius: 6,
            background: "#fafafa",
            margin: "4px",
            fontSize: 14,
            display: "flex",
            padding: "1px 8px",
            justifyContent: "center",
            alignItems: "center",
            fontWeight: 500,
          }}
        >
          {getValueDragAndDrop() ? (
            <strong>{getValueDragAndDrop()}</strong>
          ) : (
            <strong style={{ opacity: 1 }}>{questionNumber}</strong>
          )}
        </div>
        <span>{children}</span>
      </div>
    );
  }

  const hasAnswer = Boolean(inpValue || selectedValues);

  return (
    <span
      {...attributes}
      contentEditable={false}
      style={{ display: "inline-flex", alignItems: "center", margin: "4px" }}
    >
      {checkUrl() && view ? (
        <>
          <Button
            type={hasAnswer ? "primary" : "default"}
            style={{ width: "100px" }}
            onClick={() => setIsModalOpen(true)}
          >
            {element.placeholder}
          </Button>
          <Modal
            title={`Enter the answer to question ${element.placeholder}`}
            open={isModalOpen}
            onOk={handleModalOk}
            onCancel={() => setIsModalOpen(false)}
          >
            <Select
              mode="tags"
              style={{ width: "100%" }}
              placeholder="Enter answers"
              onChange={handleSelectChange}
              defaultValue={
                inpValue
                  ? inpValue.split("; ").map((v) => v.trim())
                  : selectedValues
                  ? selectedValues.split("; ").map((v) => v.trim())
                  : null
              }
            />
          </Modal>
        </>
      ) : (
        <Input
          type={element.inputType || "text"}
          id={"ques-" + (element.placeholder || "input")}
          placeholder={element.placeholder}
          value={inpValue || inputValue || getValue()}
          onChange={handleChange}
          onBlur={handleBlur}
          style={{
            padding: "4px",
            borderRadius: "10px",
            textAlign: "center",
          }}
        />
      )}
      {children}
    </span>
  );
};

export default InputElement;
