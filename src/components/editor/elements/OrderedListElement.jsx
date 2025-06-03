import React from "react";

const OrderedListElement = ({ attributes, children, element }) => {

  const checkISDecimal = (element) => {
    return element.listStyleType === "decimal" ? element.start : 1;
  };

  return <ol {...attributes} style={{ listStyle: element.listStyleType || "decimal" }} start={checkISDecimal(element)}>
    {children}
  </ol>
};

export default OrderedListElement;
