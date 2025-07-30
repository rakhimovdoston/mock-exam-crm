import React from "react";
import { useSelector } from "react-redux";

const DefaultElement = ({ attributes, children, element }) => {
  
  const { size } = useSelector((state) => state.app);
  const alignment = element.align || "left";
  return (
    <div
      {...attributes}
      style={{
        textAlign: alignment,
        fontSize: `${size}px`
      }}
    >
      {children}
    </div>
  );
};

export default DefaultElement;
