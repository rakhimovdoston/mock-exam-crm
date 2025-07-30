import React from "react";
import { useSelector } from "react-redux";

const TableRowElement = ({ attributes, children }) => {
  const { size } = useSelector((state) => state.app);
  return (
    <tr {...attributes} style={{ fontSize: `${size}px` }}>
      {children}
    </tr>
  );
};

export default TableRowElement;
