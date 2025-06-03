import React from "react";

const ParagraphElement = ({ attributes, children, element }) => {
  
  const alignment = element.align || "left";
  return (
    <p
      {...attributes}
      style={{
        textAlign: alignment,
      }}
    >
      {children}
    </p>
  );
};

export default ParagraphElement;
