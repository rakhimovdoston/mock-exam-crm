import React from "react";
import { useSelector } from "react-redux";

const TableElementViewer = ({ attributes, children, element }) => {
  const {size} = useSelector(state => state.app);
  return (
    <table
      style={{
        borderCollapse: "collapse",
        tableLayout: "fixed",
        width: "100%",
        fontSize: `${size}px`
      }}
    >
      <tbody {...attributes}>{children}</tbody>
    </table>
  );
};

export default TableElementViewer;
