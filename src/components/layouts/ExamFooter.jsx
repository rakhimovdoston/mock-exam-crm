import React from "react";
import { Card, Layout } from "antd";
import { useSelector } from "react-redux";

const { Footer } = Layout;

const ExamFooter = ({ selectPart, setSelectPart }) => {
  const { answers } = useSelector((state) => state.exam);

  const getKeysNumbers = (keys) => {
    const [start, end] = keys.split("-");
    const startNum = parseInt(start, 10);
    const endNum = parseInt(end, 10);
    const numbers = [];
    for (let i = startNum; i <= endNum; i++) {
      numbers.push(i);
    }
    return numbers;
  };
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
      {answers.map((answer, index) => (
        <Card
          key={index}
          onClick={() => setSelectPart(answer.type)}
          style={{
            height: "50px",
            flex: 1,
            border: `1px solid ${
              selectPart === answer.type ? "#1890ff" : "#d9d9d9"
            }`,
            backgroundColor: "white",
            borderRadius: "10px",
            cursor: "pointer",
            padding: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", gap: "15px" }}>
            {answer.answers.map((ans, index) => {
              return ans.key ? (
                <span
                  key={index}
                  style={{
                    textAlign: "center",
                    color: `${ans.value ? "blue" : "gray"}`,
                  }}
                >
                  {ans.key}
                </span>
              ) : (
                getKeysNumbers(ans.keys).map((key, idx) => (
                  <span
                    key={idx}
                    style={{
                      textAlign: "center",
                      color: `${ans.values.length > 0 ? "blue" : "gray"}`,
                    }}
                  >
                    {key}
                  </span>
                ))
              );
            })}
          </div>
        </Card>
      ))}
    </Footer>
  );
};

export default ExamFooter;
