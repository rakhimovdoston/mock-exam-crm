import React from "react";
import { useSelector } from "react-redux";

const ReadOnlyMultipleChoiceElement = ({ element, attributes, children }) => {
  const { size } = useSelector((state) => state.app);

  const questionElement = React.Children.toArray(children).find(
    (child) => child.props.children?.props.element.type === "span"
  );
  const optionElements = React.Children.toArray(children).filter(
    (child) => child.props.children?.props.element.type === "option"
  );

  return (
    <div {...attributes} className="exam-question">
      <div className="exam-question__prompt" style={{ fontSize: `${size}px` }}>
        <span className="exam-question__num">{element.id}</span>
        {questionElement}
      </div>
      <div className="exam-options">{optionElements}</div>
    </div>
  );
};

export default ReadOnlyMultipleChoiceElement;
