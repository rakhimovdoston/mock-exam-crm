import React from "react";
import { useSelector } from "react-redux";

const ParagraphElement = ({ attributes, children, element }) => {
  
  const {size} = useSelector(state => state.app);
  const alignment = element.align || "left";
  return (
    <p
      {...attributes}
      style={{
        textAlign: alignment,
        fontSize: `${size}px`
      }}
    >
      {children}
    </p>
  );
};

export default ParagraphElement;
