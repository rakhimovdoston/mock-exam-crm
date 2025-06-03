import React from "react";

const DefaultElement = ({ attributes, children, element }) => {
  
  const alignment = element.align || "left";
  return (
    <div
      {...attributes}
      style={{
        textAlign: alignment,
      }}
    >
      {children}
    </div>
  );
};

export default DefaultElement;
