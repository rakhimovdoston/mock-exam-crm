import { Checkbox } from "antd";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateMultipleAnswer } from "../../../../store/answerReducer";
import { updateForUserMultipleAnswers } from "../../../../store/examReducer";

const CheckboxViewElement = ({ attributes, element, children }) => {
  const dispatch = useDispatch();
  const { answers } = useSelector((state) => state.answer);
  const userAnswer = useSelector((state) => state.exam);

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
    <div {...attributes}>
      <Checkbox
        checked={checkIsAnswer(element.optionValue, answers)}
        onChange={(e) => {
          if (answers.length > 0) {
            dispatch(
              updateMultipleAnswer({
                keys: getKeys(),
                values: element.optionValue,
              })
            );
          } else {
            dispatch(
              updateForUserMultipleAnswers({
                keys: getKeys(),
                values: element.optionValue,
              })
            );
          }
        }}
        style={{
          display: "flex",
          alignItems: "center",
        }}
      >
        <span>{children}</span>
      </Checkbox>
    </div>
  );
};

export default CheckboxViewElement;