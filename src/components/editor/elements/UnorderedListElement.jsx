import React from "react";
import { useReturnDrop } from "../contexts/DragContext";

// This component renders an unordered list element in a rich text editor.
const UnorderedListElement = ({
  attributes,
  children,
  is_passage = false,
  dragAndDrop = false,
  type = "default",
}) => {
  // On the question side the list is the word bank, so dropping an answer back
  // onto it returns that answer to the bank.
  const { isOver, dropProps } = useReturnDrop();
  const isBank = !is_passage;
  const bankProps = isBank ? dropProps : {};
  const bankClass = isBank ? `exam-bank${isOver ? " exam-bank--over" : ""}` : "";

  if (dragAndDrop && type === "Summary Completion") {
    return (
      <ul
        {...attributes}
        {...bankProps}
        className={bankClass}
        style={{
          padding: 0,
          display: "flex",
          listStyle: "none",
          gap: "6px",
          flexWrap: "wrap",
        }}
      >
        {children}
      </ul>
    );
  }

  return (
    <ul
      {...attributes}
      {...bankProps}
      className={bankClass}
      style={{ padding: "0 0 0 10px" }}
    >
      {children}
    </ul>
  );
};

export default UnorderedListElement;
