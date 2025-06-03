import React from "react";

const TableElement = ({ attributes, children }) => (
  <table {...attributes} style={{ borderCollapse: "collapse", width: "100%" }}>
    <tbody>{children}</tbody>
  </table>
);

export default TableElement;
