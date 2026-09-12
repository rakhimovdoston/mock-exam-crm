import React from "react";
import { CheckSquareOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";

const NUMBER_WORDS = ["ONE", "TWO", "THREE", "FOUR"];

const MultipleChoiceMultipleAnswerElement = ({
  attributes,
  element,
  children,
}) => {
  const { size } = useSelector((state) => state.app);

  const questionElement = React.Children.toArray(children).find(
    (child) => child.props.children?.props.element.type === "span"
  );
  const optionElements = React.Children.toArray(children).filter(
    (child) => child.props.children?.props.element.type === "checkbox"
  );

  const requiredCount = NUMBER_WORDS[element.questionNumber - 1] || "ONE";

  // Letter range is derived from the options actually present in the node.
  const optionCount =
    element.children?.filter((child) => child.type === "checkbox").length || 6;
  const letters = `A-${String.fromCharCode(64 + optionCount)}`;

  // Question numbers this block covers, e.g. 31-32.
  const start = element.startInputId || 1;
  const end = start + (element.questionNumber || 1) - 1;
  const range = start === end ? `${start}` : `${start}-${end}`;

  return (
    <div
      {...attributes}
      className="exam-question"
      style={{ fontSize: `${size}px` }}
    >
      <div className="exam-question__prompt">
        <span className="exam-question__num">{range}</span>
        {questionElement}
      </div>

      <div className="exam-hint" contentEditable={false}>
        <CheckSquareOutlined />
        <span>
          Choose <b>{requiredCount}</b> letters <b>{letters}</b>
        </span>
      </div>

      <div className="exam-options">{optionElements}</div>
    </div>
  );
};

export default MultipleChoiceMultipleAnswerElement;
