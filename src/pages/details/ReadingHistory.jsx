import React from "react";
import useApiRequest from "../../hooks/useApiRequest";
import { Layout, Spin, Typography, Row, Col } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";

const ReadingHistory = () => {
  const { id } = useParams();

  const { data, loading, error } = useApiRequest(
    `api/v1/history/mock-exam/${id}?type=reading`,
    [id]
  );

  if (loading)
    return (
      <Layout
        style={{
            borderRadius: "10px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: '100%'
        }}
      >
        <Spin tip="Loading..." />
      </Layout>
    );

  if (!data || error)
    return (
      <Typography.Text type="danger">
        Mock test exam history not found
      </Typography.Text>
    );

  const getValue = (answer, userAnswers) => {
    for (const ans of userAnswers) {
      if (answer.key && ans.key === ans.key) return ans.value;

      if (answer.keys && ans.keys === answer.keys) return ans.values;
    }
    return "-";
  };

  const isCorrect = (answer, userAnswers) => {
    for (const ans of userAnswers) {
      if (answer.key && ans.key === ans.key) return ans.value === answer.value;

      if (answer.keys && ans.keys === answer.keys)
        return ans.values === answer.values;
    }
  };

  const part = (min, max) => {
    return data.data.answers.filter(ans => {
        if (ans.key) {
            return ans.key <= max && ans.key >= min
        }
        if (ans.keys) {
            const minKey = Number(ans.keys.split("-")[0]);
            const maxKey = Number(ans.keys.split("-")[1]);
            return maxKey <= max && maxKey >= min;
        }
        return false
    });
  }

  const renderPart = (title, questions) => {
    return (
      <div style={{ marginBottom: "20px" }}>
        <Typography.Title level={4}>{title}</Typography.Title>
        <Row gutter={[16, 16]}>
          {questions.map((answer) => {
            return (
              <Col span={6} key={answer.key}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    backgroundColor: isCorrect(answer, data.data.userAnswers)
                      ? "#e6f7e6"
                      : "",
                  }}
                >
                  <div style={{display: "flex", gap: "10px", color: "green"}}>
                    <Typography.Text strong style={{color: "green"}}>{answer.key ? answer.key : answer.keys}.</Typography.Text>
                    <Typography.Text style={{color: "green"}}>{answer.value}</Typography.Text>
                  </div>
                  <Typography.Text style={{color : isCorrect(answer, data.data.userAnswers) ? "green" : "red"}}>
                    {getValue(answer, data.data.userAnswers)}
                  </Typography.Text>
                  {/* {isCorrect ? (
                    <CheckCircleOutlined
                      style={{ color: "green", fontSize: "18px" }}
                    />
                  ) : (
                    <CloseCircleOutlined
                      style={{ color: "red", fontSize: "18px" }}
                    />
                  )} */}
                </div>
              </Col>
            );
          })}
        </Row>
      </div>
    );
  };

  return (
    <Layout style={{ padding: "20px", borderRadius: "10px", }}>
      <Typography.Title level={3}>Reading History</Typography.Title>
      {renderPart("Questions 1-13", part(1, 13))}
      {renderPart("Questions 13-26", part(14, 26))}
      {renderPart("Questions 27-40", part(27, 40))}
    </Layout>
  );
};

export default ReadingHistory;
