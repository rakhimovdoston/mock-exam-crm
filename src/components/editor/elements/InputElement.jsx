import React, { useState, useEffect } from "react";
import { useSlateStatic, ReactEditor } from "slate-react";
import { Transforms } from "slate";
import { Input } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { updateAnswer } from "../../../store/answerReducer";
import { getValueFromAnswer } from "../../../utils";
import { updateForUserAnswers } from "../../../store/examReducer";

const InputElement = ({ attributes, element, children }) => {
  const editor = useSlateStatic();
  const path = ReactEditor.findPath(editor, element);
  const {answers} = useSelector((state) => state.answer);
  const inpValue = getValueFromAnswer(element.placeholder, answers);

  const [inputValue, setInputValue] = useState(element.value || "");
  const dispatch = useDispatch();

  useEffect(() => {
    setInputValue(element.value || "");
  }, [element.value]);

  const handleChange = (e) => {
    setInputValue(e.target.value);
    const idNumber = parseInt(e.target.id.replace("ques-", ""), 10);
    if (answers.length > 0) {
      dispatch(updateAnswer({key: idNumber, value: e.target.value}));
    } else {
      dispatch(updateForUserAnswers({key: idNumber, value: e.target.value}));
    }
  };

  const handleBlur = () => {
    Transforms.setNodes(
      editor,
      { value: inputValue },
      { at: path }
    );
  };

  return (
    <span
      {...attributes}
      contentEditable={false}
      style={{ display: "inline-flex", alignItems: "center", margin: "4px" }}
    >
      <Input
        type={element.inputType || "text"}
        id={"ques-" + (element.placeholder || "input")}
        placeholder={element.placeholder}
        value={inpValue || inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        style={{
          padding: "4px",
          borderRadius: "10px",
          textAlign: "center",
        }}
      />
      {children}
    </span>
  );
};


export default InputElement;
