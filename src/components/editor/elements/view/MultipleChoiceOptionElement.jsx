import { Radio } from "antd";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
// import { getValueFromAnswer } from "../../../../utils";
import { updateAnswer } from "../../../../store/answerReducer";
import { updateForUserAnswers } from "../../../../store/examReducer";

const MultipleChoiceOptionElement = ({ element, attributes, children }) => {
  const dispatch = useDispatch();
  const { answers } = useSelector((state) => state.answer);
  const userAnswer = useSelector((state) => state.exam);

  const checkCorrectAnswer = () => {
    const answer = answers.find((a) => a.key === element.id);
    return answer ? answer.value === element.optionValue : false;
  };

  const checkedValue = () => {
    for (const ans of userAnswer.answers) {
      for (const a of ans.answers) {
        if (a.key === element.id) {
          return a.value === element.optionValue;
        }
      }
    }
    return false;
  };

  return (
    <Radio
      {...attributes}
      checked={checkedValue() || checkCorrectAnswer()}
      onClick={() => {
        if (answers.length > 0) {
          dispatch(
            updateAnswer({ key: element.id, value: element.optionValue })
          );
        } else {
          dispatch(
            updateForUserAnswers({
              key: element.id,
              value: element.optionValue,
            })
          );
        }
      }}
    >
      {children}
    </Radio>
  );
};

export default MultipleChoiceOptionElement;
