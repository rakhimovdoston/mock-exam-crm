import React from "react";

const TableCellElement = ({ attributes, children }) => (
  <td
    {...attributes}
    style={{
      border: "1px solid #999",
      padding: "8px",
      textAlign: "left",
      minWidth: "120px",
      width: "120px",
    }}
  >
    {children}
  </td>
);

export default TableCellElement;
