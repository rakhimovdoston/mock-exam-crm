import React from "react";

// This component renders an unordered list element in a rich text editor.
const UnorderedListElement = ({
  attributes,
  children,
  is_passage = false,
  dragAndDrop = false,
  type = "default",
}) => {
  if (dragAndDrop && type === "Summary Completion") {
    return <ul
      {...attributes}
      style={{ padding: 0, display: "flex", listStyle: "none", gap: "4px", flexWrap: "wrap" }}
    >
      {children}
    </ul>;
  }

  return (
    <ul {...attributes} style={{ padding: "0 0 0 10px" }}>
      {children}
    </ul>
  );
};

export default UnorderedListElement;
