import React from "react";

const TableRowElement = ({ attributes, children }) => {
  return <tr {...attributes}>{children}</tr>;
};

export default TableRowElement;
