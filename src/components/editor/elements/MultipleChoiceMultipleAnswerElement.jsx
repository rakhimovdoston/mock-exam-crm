import React from "react";
import { Card, Checkbox } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { updateMultipleAnswer } from "../../../store/answerReducer";
import { updateForUserMultipleAnswers } from "../../../store/examReducer";

const MultipleChoiceMultipleAnswerElement = ({
  attributes,
  element,
  children,
}) => {
  const dispatch = useDispatch();
  const { answers } = useSelector((state) => state.answer);
  const userAnswer = useSelector((state) => state.exam);
  const { size } = useSelector((state) => state.app);

  const getValue = (questionNumber) => {
    switch (questionNumber) {
      case 1:
        return "ONE";
      case 2:
        return "TWO";
      case 3:
        return "THREE";
      case 4:
        return "FOUR";
      default:
        return `ONE`;
    }
  };

  const getLetters = (options) => {
    return String.fromCharCode(65) + "-" + String.fromCharCode(65 + 5);
  };

  return (
    <div
      {...attributes}
      style={{
        fontSize: `${size}px`,
        marginBottom: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      <div style={{ fontSize: `${size}px` }}>
        <em>
          Choose <b>{getValue(element.questionNumber)}</b> letters{" "}
          <b>{getLetters(element.options)}</b>
        </em>
      </div>
      {/* {element.options.map((opt, index) => (
          <div key={index} style={{ display: "flex", gap: "0.5rem" }}>
            <span style={{ fontWeight: "bold" }}>
              {String.fromCharCode(65 + index)}.
            </span>
            <Checkbox
              checked={checkIsAnswer(opt, answers)}
              onChange={(e) => {
                if (answers.length > 0) {
                  dispatch(
                    updateMultipleAnswer({ keys: getKeys(), values: opt })
                  );
                } else {
                  dispatch(
                    updateForUserMultipleAnswers({
                      keys: getKeys(),
                      values: opt,
                    })
                  );
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: `${size}px`,
              }}
            >
              <span>{opt}</span>
            </Checkbox>
          </div>
        ))} */}
      {children}
    </div>
  );
};

export default MultipleChoiceMultipleAnswerElement;
