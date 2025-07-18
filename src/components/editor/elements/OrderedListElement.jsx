import React from "react";

const OrderedListElement = ({ attributes, children, element }) => {
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
      itemElement.questionsType === "Matching Features");

  if (isDecimal(element) && checkMatchingInformation) {
    return (
      <div style={{ width: "100%" }}>
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            tableLayout: "fixed",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f7f7f7" }}>
              <th
                style={{
                  textAlign: "left",
                  paddingRight: "12px",
                  border: "1px solid #ccc",
                }}
              ></th>
              {/* <div style={{ display: "flex", justifyContent: "flex-end" }}> */}
              {itemElement.headingOptions.map((heading, index) => (
                <th
                  key={index}
                  style={{
                    textAlign: "center",
                    width: "28px",
                    height: "48px",
                    padding: "8px",
                    border: "1px solid #ccc",
                  }}
                >
                  {heading.value}
                </th>
              ))}
              {/* </div> */}
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
