import React from "react";

const ReadOnlyMultipleChoiceElement = ({ element, attributes, children }) => {

  const childArray = React.Children.toArray(children);

  // Savol elementini topish
  const questionElement = childArray.find((child) => {
    const nested = React.Children.toArray(child.props.children)[0];
    return nested?.props?.element?.type === "span";
  });

  // Variantlarni topish
  const optionElements = childArray.filter((child) => {
    const nested = React.Children.toArray(child.props.children)[0];
    return nested?.props?.element?.type === "option";
  });

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