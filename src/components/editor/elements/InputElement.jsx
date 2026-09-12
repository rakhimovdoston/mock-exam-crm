import React, { useState, useEffect } from "react";
import { useSlateStatic, ReactEditor } from "slate-react";
import { Transforms } from "slate";
import { Button, Input, Modal, Select } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { updateAnswer } from "../../../store/answerReducer";
import { getValueFromAnswer } from "../../../utils";
import { updateForUserAnswers } from "../../../store/examReducer";
import { useLocation } from "react-router-dom";
import { useDrag } from "../contexts/DragContext";
import DropZone from "./view/DropZone";

const InputElement = ({
  attributes,
  element,
  children,
  view = true,
  dragAndDrop = false,
}) => {
  const location = useLocation();
  const { onDropAnswer, onClearAnswer } = useDrag();
  const editor = useSlateStatic();
  const path = ReactEditor.findPath(editor, element);
  const { answers } = useSelector((state) => state.answer);
  const userAnswers = useSelector((state) => state.exam);
  const inpValue = getValueFromAnswer(element.placeholder, answers);
  const { size } = useSelector((state) => state.app);

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
        if (ans.key === element.placeholder) {
          return ans.value;
        }
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

  // Inside the viewer these come from DragProvider; the standalone editor has
  // no provider, so fall back to dispatching straight to the right store.
  const dropAnswer = (key, value, fromKey) => {
    if (onDropAnswer) {
      onDropAnswer(key, value, fromKey);
      return;
    }
    if (answers.length > 0) {
      dispatch(updateAnswer({ key, value }));
    } else {
      dispatch(updateForUserAnswers({ key, value }));
    }
  };

  const clearAnswer = (key) => {
    if (onClearAnswer) {
      onClearAnswer(key);
      return;
    }
    if (answers.length > 0) {
      dispatch(updateAnswer({ key, value: "" }));
    } else {
      dispatch(updateForUserAnswers({ key, value: "" }));
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
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <DropZone
          questionNumber={questionNumber}
          value={getValueDragAndDrop()}
          onDropAnswer={dropAnswer}
          onClearAnswer={clearAnswer}
          fontSize={size}
          emptyWidth={120}
          placeholder="Drop here"
        />
        <span>{children}</span>
      </span>
    );
  }

  const currentValue = inpValue || getValue();
  const hasAnswer = Boolean(
    checkUrl() && view ? inpValue || selectedValues : currentValue
  );

  return (
    <span
      {...attributes}
      contentEditable={false}
      className={`exam-gap${hasAnswer ? " exam-gap--filled" : ""}`}
    >
      {checkUrl() && view ? (
        <>
          <Button
            type={hasAnswer ? "primary" : "default"}
            style={{ minWidth: "100px" }}
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
          prefix={
            element.placeholder ? (
              <span className="exam-gap__num">{element.placeholder}</span>
            ) : null
          }
          value={currentValue}
          autoComplete="off"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          allowClear={false}
          onChange={handleChange}
          onBlur={handleBlur}
          style={{ fontSize: `${size}px` }}
        />
      )}
      {children}
    </span>
  );
};

export default InputElement;
