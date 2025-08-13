import React from "react";

const ReadOnlyMultipleChoiceElement = ({ element, attributes, children }) => {

  const questionElement = React.Children.toArray(children).find(
    (child) => child.props.children.props.element.type === "span"
  );
  const optionElements = React.Children.toArray(children).filter(
    (child) => child.props.children.props.element.type === "option"
  );

  return (
    <div {...attributes} style={{ marginBottom: "1rem" }}>
      <div
        style={{
          display: "flex",
          gap: "5px",
          marginBottom: "10px",
        }}
      >
        <b>{element.id}.</b>
        {questionElement}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {optionElements}
      </div>
    </div>
  );
};

export default ReadOnlyMultipleChoiceElement;