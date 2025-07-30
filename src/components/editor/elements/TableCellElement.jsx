import React from "react";
import { useSelector } from "react-redux";

const TableCellElement = ({ attributes, element, children }) => {
  const { size } = useSelector((state) => state.app);
  return (
    <td
      {...attributes}
      style={{
        border: "1px solid #ccc",
        padding: "8px",
        width: element.width || 120,
        height: element.height || 40,
        textAlign: "left",
        fontSize: `${size}px`,
        minWidth: "120px",
      }}
    >
      {children}
    </td>
  );
};

export default TableCellElement;
