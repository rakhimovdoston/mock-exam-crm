import React from "react";

// This component renders an unordered list element in a rich text editor.
const UnorderedListElement = ({ attributes, children }) => (
  <ul {...attributes}>{children}</ul>
);

export default UnorderedListElement;
