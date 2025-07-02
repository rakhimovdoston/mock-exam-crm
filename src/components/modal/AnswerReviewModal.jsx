import React from "react";
import { Modal, Typography, Row, Col, Button, Flex } from "antd";
import { useSelector } from "react-redux";

const { Title, Text } = Typography;

const AnswerReviewModal = ({ open, onClose }) => {
  const { answers } = useSelector((state) => state.exam);
  const totalQuestions = 40;
  const columns = 5;
  const rows = Math.ceil(totalQuestions / columns);
  const renderAnswersGrid = () => {
    const userAnswers = answers.flatMap((ans) => ans.answers);

    const cells = [];

    for (const answer of userAnswers) {
      const qNumber = answer.key ? answer.key : answer.keys.replace("-", "/");
      const userAnswer = answer.key ? answer.value : answer.values;

      cells.push(
        <Col
          key={qNumber}
          span={24 / columns}
          style={{
            border: "1px solid #d9d9d9",
            padding: "12px",
            minHeight: "60px",
            width: "20%",
            boxSizing: "border-box",
          }}
        >
          <Text strong>Q{qNumber}:</Text>{" "}
          <Text style={{ color: userAnswer ? "#000" : "#999" }}>
            {userAnswer}
          </Text>
        </Col>
      );
    }

    const grid = [];
    for (let row = 0; row < rows; row++) {
      const rowCells = cells.slice(row * columns, (row + 1) * columns);
      grid.push(
        <Row key={row} style={{ width: "100%" }}>
          {rowCells}
        </Row>
      );
    }

    return grid;
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={[
        <Flex justify="center">
          <Button
            key="close"
            type="primary"
            style={{
              width: "200px",
              borderRadius: "20px",
            }}
            onClick={onClose}
          >
            Close
          </Button>
          ,
        </Flex>,
      ]}
      width={700}
      centered
    >
      <Title level={4} style={{ textAlign: "center" }}>
        Review your answers
      </Title>
      <Text style={{ textAlign: "center" }}>
        * This window is to review your answers only, you cannot change the
        answers in here
      </Text>
      <div style={{ marginTop: "1.5rem" }}>{renderAnswersGrid()}</div>
    </Modal>
  );
};

export default AnswerReviewModal;
