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
    return (
      String.fromCharCode(65) +
      "-" +
      String.fromCharCode(65 + options.length - 1)
    );
  };

  const checkIsAnswer = (option, answers) => {
    if (answers.length > 0) {
      const keys = getKeys();
      
      const answer = answers.find((a) => a.keys === keys);
      
      if (answer && answer.values && answer.values.includes(option)) {
        return true;
      }
      return false;
    } else {
      const keys = getKeys();
      for (const ans of userAnswer.answers) {
        for (const a of ans.answers) {
          if (a.keys === keys && a.values && a.values.includes(option)) {
            return true;
          }
        }
      }
      return false;
    }
  };

  const getKeys = () => {
    const numbers = element.questionNumber;
    const start = element.startInputId || 1;
    return start + "-" + (start + numbers - 1);
  };

  return (
    <Card
      {...attributes}
      style={{
        borderRadius: "8px",
        fontSize: "16px",
      }}
    >
      <div>
        <em>
          Choose <b>{getValue(element.questionNumber)}</b> letters{" "}
          <b>{getLetters(element.options)}</b>
        </em>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <span>{element.question}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {element.options.map((opt, index) => (
          <div key={index} style={{ display: "flex", gap: "0.5rem" }}>
            <span style={{ fontWeight: "bold" }}>
              {String.fromCharCode(65 + index)}.
            </span>
            <Checkbox
              checked={checkIsAnswer(opt, answers)}
              onChange={(e) => {
                console.log("Clicked:");
                
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
              style={{ display: "flex", alignItems: "center" }}
            >
              <span>{opt}</span>
            </Checkbox>
          </div>
        ))}
      </div>
      {children}
    </Card>
  );
};

export default MultipleChoiceMultipleAnswerElement;
