import React from "react";

const TableElementViewer = ({ attributes, children, element }) => {
  return (
    <table
      style={{
        borderCollapse: "collapse",
        tableLayout: "fixed",
        width: "100%",
      }}
    >
      <tbody {...attributes}>{children}</tbody>
    </table>
  );
};

export default TableElementViewer;
