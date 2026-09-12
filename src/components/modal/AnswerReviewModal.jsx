import React from "react";
import { Button, Modal, Progress, Typography } from "antd";
import { CheckCircleFilled, ExclamationCircleFilled } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { getPartLabel } from "../../utils";
import "../../styles/exam.css";

const { Title, Text } = Typography;

// One answer entry becomes one review cell. Gap-fill and single-choice answers
// carry `key`/`value`; multi-answer groups carry `keys`/`values`.
const toCell = (answer) => {
  if (answer.key) {
    return {
      id: `q-${answer.key}`,
      label: answer.key,
      value: answer.value ? String(answer.value) : "",
    };
  }

  const values = Array.isArray(answer.values) ? answer.values : [];
  return {
    id: `g-${answer.keys}`,
    label: (answer.keys || "").replace("-", "–"),
    value: values.join(", "),
  };
};

const AnswerReviewModal = ({ open, onClose }) => {
  const { answers } = useSelector((state) => state.exam);
  const parts = Array.isArray(answers) ? answers : [];

  const allCells = parts.flatMap((part) => (part.answers || []).map(toCell));
  const answeredCount = allCells.filter((cell) => cell.value).length;
  const total = allCells.length;
  const unanswered = total - answeredCount;
  const percent = total ? Math.round((answeredCount / total) * 100) : 0;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Button
            type="primary"
            style={{ minWidth: 200, borderRadius: 999 }}
            onClick={onClose}
          >
            Back to questions
          </Button>
        </div>
      }
      width={780}
      centered
      styles={{ body: { maxHeight: "66vh", overflowY: "auto" } }}
    >
      <Title level={4} style={{ marginBottom: 4 }}>
        Review your answers
      </Title>
      <Text type="secondary">
        This window is for checking your answers only — you cannot change them
        here.
      </Text>

      <div className="exam-review__summary" style={{ marginTop: 18 }}>
        <div>
          <span className="exam-review__count">
            {answeredCount}/{total}
          </span>{" "}
          <Text type="secondary">questions answered</Text>
          <div style={{ marginTop: 4 }}>
            {unanswered > 0 ? (
              <Text style={{ color: "var(--exam-danger)", fontWeight: 600 }}>
                <ExclamationCircleFilled /> {unanswered} left blank
              </Text>
            ) : (
              <Text style={{ color: "var(--exam-success-text)", fontWeight: 600 }}>
                <CheckCircleFilled /> Everything is answered
              </Text>
            )}
          </div>
        </div>

        <Progress
          type="circle"
          size={64}
          percent={percent}
          strokeColor="var(--exam-accent)"
        />
      </div>

      {parts.map((part, index) => {
        const cells = (part.answers || []).map(toCell);

        return (
          <div key={part.type ?? index} className="exam-review__part">
            <h4 className="exam-review__part-title">
              {getPartLabel(part.type, index)}
            </h4>
            <div className="exam-review__grid">
              {cells.map((cell) => (
                <div
                  key={cell.id}
                  className={`exam-review__cell${
                    cell.value ? "" : " exam-review__cell--empty"
                  }`}
                >
                  <span className="exam-review__num">{cell.label}</span>
                  <span
                    className={`exam-review__value${
                      cell.value ? "" : " exam-review__value--empty"
                    }`}
                  >
                    {cell.value || "Not answered"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </Modal>
  );
};

export default AnswerReviewModal;
