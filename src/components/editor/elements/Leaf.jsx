import React from "react";

const Leaf = ({ attributes, children, leaf }) => {
  return (
    <span
      {...attributes}
      style={{
        fontWeight: leaf.bold ? "bold" : "normal",
        fontStyle: leaf.italic ? "italic" : "normal",
        textDecoration: leaf.underline ? "underline" : "none",
        backgroundColor: leaf.highlight || "transparent",
      }}
    >
      {children}
    </span>
  );
};

export default Leaf;
