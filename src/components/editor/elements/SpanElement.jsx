import React from "react";
import { useSelector } from "react-redux";

const SpanElement = ({ attributes, children, element }) => {
  const alignment = element.align || "left";
  const { size } = useSelector((state) => state.app);
  return (
    <span {...attributes} style={{ textAlign: alignment, fontSize: `${size}px` }}>
      {children}
    </span>
  );
};

export default SpanElement;
