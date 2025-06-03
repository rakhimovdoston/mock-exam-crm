import React from "react";

const SpanElement = ({ attributes, children, element }) => {
  const alignment = element.align || "left";
  return (
    <span {...attributes} style={{ textAlign: alignment }}>
      {children}
    </span>
  );
};

export default SpanElement;
