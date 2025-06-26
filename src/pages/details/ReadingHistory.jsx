import React, { useMemo } from "react";
import useApiRequest from "../../hooks/useApiRequest";
import { Layout, Spin, Typography, Row, Col, Card } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { checkKey, checkKeys, countCorrectAnswers } from "../../utils";

const { Title, Text } = Typography;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
`;

const IconWrapper = styled.div`
  animation: ${pulse} 1s ease-in-out;
  color: ${({ correct }) => (correct ? "#52c41a" : "#f5222d")};
  font-size: 20px;
`;

const StyledCard = styled(Card)`
  border-radius: 12px !important;
  transition: box-shadow 0.3s ease, transform 0.2s ease;
  background-color: ${({ correct }) =>
    correct ? "#f6ffed" : "#fff1f0"} !important;
  border-color: ${({ correct }) =>
    correct ? "#b7eb8f" : "#ffa39e"} !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  &:hover {
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
    transform: translateY(-4px);
  }
`;

const Container = styled(Layout)`
  background: #fafafa;
  padding: 32px;
  border-radius: 16px;
  min-height: 100vh;
`;

const ReadingHistory = () => {
  const { id } = useParams();

  const { data, loading, error } = useApiRequest(
    `api/v1/history/mock-exam/${id}?type=reading`,
    [id]
  );

  const isCorrect = (answer, userAnswers) => {
    if (answer.key) return checkKey(answer, userAnswers);

    if (answer.keys) {
      const count = checkKeys(answer, userAnswers);
      return count > 0;
    }

    return false;
  };

  const correctCount = useMemo(() => {
    if (!data?.data?.answers || !data?.data?.userAnswers) return 0;
    return countCorrectAnswers(data.data.answers, data?.data?.userAnswers);
  }, [data]);

  if (loading)
    return (
      <Layout
        style={{
          borderRadius: "10px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100vh",
          background: "#fafafa",
        }}
      >
        <Spin tip="Loading..." size="large" />
      </Layout>
    );

  if (!data || error)
    return (
      <Text type="danger" style={{ fontSize: 18 }}>
        Mock test exam history not found
      </Text>
    );

  // Helper functions for answers
  const getValue = (answer, userAnswers) => {
    for (const ans of userAnswers) {
      if (answer.key && ans.key === answer.key) return ans.value;
      if (answer.keys && ans.keys === answer.keys) return ans.values;
    }
    return "-";
  };

  const part = (min, max) => {
    return data.data.answers.filter((ans) => {
      if (ans.key) return ans.key >= min && ans.key <= max;
      if (ans.keys) {
        const [minKey, maxKey] = ans.keys.split("-").map(Number);
        return minKey >= min && maxKey <= max;
      }
      return false;
    });
  };

  const totalCount = 40;

  const renderPart = (title, questions) => (
    <section style={{ marginBottom: 32 }}>
      <Title level={4}>{title}</Title>
      <Row gutter={[24, 24]}>
        {questions.map((answer) => {
          const correct = isCorrect(answer, data.data.userAnswers);
          const userValue = getValue(answer, data.data.userAnswers);
          const correctValue = answer.value
            ? answer.value
            : Array.isArray(answer.values)
            ? answer.values.join(", ")
            : answer.values;

          return (
            <Col xs={24} sm={12} md={8} lg={6} key={answer.key || answer.keys}>
              <StyledCard correct={correct} hoverable>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 12,
                    alignItems: "center",
                  }}
                >
                  <Text strong style={{ fontSize: 16 }}>
                    {answer.key || answer.keys}
                  </Text>
                  <IconWrapper correct={correct}>
                    {correct ? (
                      <CheckCircleOutlined />
                    ) : (
                      <CloseCircleOutlined />
                    )}
                  </IconWrapper>
                </div>
                <Text
                  style={{
                    display: "block",
                    color: "#1890ff",
                    marginBottom: 6,
                  }}
                >
                  <strong>Correct:</strong> {correctValue}
                </Text>
                <Text
                  style={{
                    display: "block",
                    color: correct ? "#52c41a" : "#f5222d",
                    fontWeight: "500",
                  }}
                >
                  <strong>Your:</strong>{" "}
                  {Array.isArray(userValue) ? userValue.join(", ") : userValue}
                </Text>
              </StyledCard>
            </Col>
          );
        })}
      </Row>
    </section>
  );

  return (
    <Container>
      <Title level={3} style={{ marginBottom: 24 }}>
        📘 Reading History
      </Title>

      <Text style={{ fontSize: 18, marginBottom: 32, display: "block" }}>
        <strong>Correct Answers:</strong> {correctCount} / {totalCount}
      </Text>

      {renderPart("Questions 1–13", part(1, 13))}
      {renderPart("Questions 14–26", part(14, 26))}
      {renderPart("Questions 27–40", part(27, 40))}
    </Container>
  );
};

export default ReadingHistory;
