import React from "react";

const TableCellElement = ({ attributes, element, children }) => (
  <td
    {...attributes}
    style={{
      border: "1px solid #ccc",
      padding: "8px",
      width: element.width || 120,
      height: element.height || 40,
      textAlign: "left",
      minWidth: "120px",
    }}
  >
    {children}
  </td>
);

export default TableCellElement;
