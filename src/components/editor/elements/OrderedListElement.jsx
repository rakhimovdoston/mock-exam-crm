import React from "react";
import { useReturnDrop } from "../contexts/DragContext";

const OrderedListElement = ({
  attributes,
  children,
  element,
  is_passage = false,
}) => {
  // Question-side lists double as the word bank for drag & drop questions.
  const { isOver, dropProps } = useReturnDrop();
  const isBank = !is_passage;

  const checkISDecimal = (element) => {
    return element.listStyleType === "decimal" ? element.start : 1;
  };

  const isDecimal = (element) => {
    return element.listStyleType === "decimal";
  };

  const getInverChildren = () => {
    let child = null;

    for (const inverChild of element.children) {
      if (inverChild.type === "list-item") {
        child = inverChild;
        break;
      }
    }
    return child;
  };
  const itemElement = getInverChildren();
  const checkMatchingInformation =
    itemElement &&
    (itemElement.questionsType === "Matching Information" ||
      itemElement.questionsType === "Matching Features" ||
      itemElement.questionsType === "Matching" || itemElement.questionsType === 'Map & Plan Labelling');
      

  if (isDecimal(element) && checkMatchingInformation) {

    return (
      <div style={{ width: "100%", overflowX: "auto" }}>
        <table className="exam-matching-table">
          <thead>
            <tr>
              <th></th>
              {itemElement.headingOptions.map((heading, index) => (
                <th key={index} style={{ width: "56px" }}>
                  {heading.value}
                </th>
              ))}
            </tr>
          </thead>
          <tbody {...attributes}>{children}</tbody>
        </table>
      </div>
    );
  }

  return (
    <ol
      {...attributes}
      {...(isBank ? dropProps : {})}
      className={isBank ? `exam-bank${isOver ? " exam-bank--over" : ""}` : ""}
      style={{
        listStyle: element.listStyleType || "decimal",
        padding: "0 0 0 20px",
        width: "clamp(450px, 100%, 900px)",
      }}
      start={checkISDecimal(element)}
    >
      {children}
    </ol>
  );
};

export default OrderedListElement;
