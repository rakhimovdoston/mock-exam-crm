import React from "react";
import { Card, Layout } from "antd";
import { useSelector } from "react-redux";

const { Footer } = Layout;

const ExamFooter = ({ types, selectPart, setSelectPart }) => {

  const { answers } = useSelector((state) => state.answer);

  return (
    <Footer
      style={{
        position: "sticky",
        padding: "10px 30px",
        bottom: 0,
        display: "flex",
        justifyContent: "space-between",
        gap: "10px",
        background: "white",
      }}
    >
      {types.map((type, index) => (
        <Card
          key={index}
          onClick={() => setSelectPart(type)}
          style={{
            height: "50px",
            flex: 1,
            border: `1px solid ${
              selectPart === type ? "#1890ff" : "#d9d9d9"
            }`,
            backgroundColor: selectPart === type ? "#e6f7ff" : "white",
            borderRadius: "10px",
            cursor: "pointer",
            padding: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {index + 1}
        </Card>
      ))}
    </Footer>
  );
};

export default ExamFooter;
