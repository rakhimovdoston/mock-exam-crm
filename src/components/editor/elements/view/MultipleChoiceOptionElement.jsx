import { Radio } from "antd";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateAnswer } from "../../../../store/answerReducer";
import { updateForUserAnswers } from "../../../../store/examReducer";

const MultipleChoiceOptionElement = ({ element, attributes, children }) => {
  const dispatch = useDispatch();
  const { answers } = useSelector((state) => state.answer);
  const userAnswer = useSelector((state) => state.exam);
  const { size } = useSelector((state) => state.app);

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

  const select = () => {
    if (answers.length > 0) {
      dispatch(updateAnswer({ key: element.id, value: element.optionValue }));
    } else {
      dispatch(
        updateForUserAnswers({ key: element.id, value: element.optionValue })
      );
    }
  };

  // The Slate attributes belong on a block wrapper, not on antd's <label> —
  // that keeps the option row a full-width block in every container.
  return (
    <div {...attributes} className="exam-option-row">
      <Radio
        className="exam-option"
        checked={checkedValue() || checkCorrectAnswer()}
        onClick={select}
        style={{ fontSize: `${size}px` }}
      >
        {children}
      </Radio>
    </div>
  );
};

export default MultipleChoiceOptionElement;
