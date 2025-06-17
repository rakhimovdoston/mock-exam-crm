import React from "react";
import useApiRequest from "../../hooks/useApiRequest";
import { Layout, Spin, Typography, Row, Col } from "antd";
import { useParams } from "react-router-dom";

const Listeninghistory = () => {
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
  
        if (answer.keys && ans.keys === answer.keys) return ans.values.join(",");
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
              const hasMultipleValues = answer.values && answer.values.length > 0;
              return (
                <Col span={hasMultipleValues ? 24 : 6} key={answer.key || answer.keys}>
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
                    <div style={{ display: "flex", gap: "10px", color: "green" }}>
                      <Typography.Text strong style={{ color: "green" }}>
                        {answer.key ? answer.key : answer.keys}.
                      </Typography.Text>
                      <Typography.Text style={{ color: "green" }}>
                        {answer.value ? answer.value : answer.values.join(", ")}
                      </Typography.Text>
                    </div>
                    <Typography.Text
                      style={{
                        color: isCorrect(answer, data.data.userAnswers)
                          ? "green"
                          : "red",
                      }}
                    >
                      {getValue(answer, data.data.userAnswers)}
                    </Typography.Text>
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
        {renderPart("Questions 1-10", part(1, 10))}
        {renderPart("Questions 11-20", part(11, 20))}
        {renderPart("Questions 21-30", part(21, 30))}
        {renderPart("Questions 31-40", part(31, 40))}
      </Layout>
    );
};

export default Listeninghistory;
