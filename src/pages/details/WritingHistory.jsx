import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useApiRequest from "../../hooks/useApiRequest";
import {
  Button,
  Col,
  Divider,
  Input,
  Layout,
  Modal,
  Row,
  Spin,
  Typography,
  Flex,
  Tooltip,
  Space,
} from "antd";
import { toast } from "react-toastify";
import { OpenAIOutlined } from "@ant-design/icons";
import apiClient from "../../services/api";

const FeedbackBox = ({ title, feedback }) => {
  return (
    <div
      style={{
        marginTop: 10,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <Typography.Text style={{ fontWeight: "bold", fontSize: 18 }}>
        {title}: ({feedback.score})
      </Typography.Text>

      {/* <Typography.Text style={{ fontWeight: "normal", fontSize: 16 }}>
        <b>Strength</b>: {feedback.strength} {feedback.sticker}
      </Typography.Text> */}
      {feedback.strength && <>
        <Typography.Text style={{ fontWeight: "normal", fontSize: 16 }}>
          <b>Description</b> {feedback.strength.description}{" "}
        </Typography.Text>
        <Typography.Text style={{ fontWeight: "normal", fontSize: 16 }}>
          <b>Example:</b>{feedback.strength.example}{" "}
        </Typography.Text>
        </>}

      <Typography.Text style={{ fontWeight: "normal", fontSize: 16 }}>
        <b>Reason</b>: {feedback.reason}
      </Typography.Text>
      {feedback.suggestion && (
        <Typography.Text style={{ fontWeight: "normal", fontSize: 16 }}>
          <b>Suggestion</b>: {feedback.suggestion}
        </Typography.Text>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {feedback.mistakes.map((item, index) => (
          <div key={index} style={{ display: "flex", flexDirection: "column" }}>
            <Typography.Text style={{ fontWeight: "normal", fontSize: 16 }}>
              <b>Mistakes: </b>
              {item.mistake}
            </Typography.Text>
            <Typography.Text style={{ fontWeight: "normal", fontSize: 16 }}>
              <b>Explanation: </b>
              {item.explanation}
            </Typography.Text>
            <Typography.Text style={{ fontWeight: "normal", fontSize: 16 }}>
              <b>Improved Version: </b>
              {item.improved_version}
            </Typography.Text>
          </div>
        ))}
      </div>
      <Divider />
    </div>
  );
};

const WritingWriting = () => {
  const { userId, id } = useParams();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedScore, setSelectedScore] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const { data, loading, error } = useApiRequest(
    `api/v1/history/mock-exam/${id}?type=writing`,
    [id, refresh]
  );

  useEffect(() => {
    if (!loading && data && data.data) setSelectedScore(data.data.score);
  }, [data]);

  const handleModalOk = async () => {
    if (errorMessage) {
      toast.error("Score must be between 0.0 and 9.0");
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiClient.post(
        `api/v1/history/set-score/${userId}`,
        {
          examId: id,
          type: "writing",
          score: selectedScore,
        }
      );
      if (response.code !== 200) {
        toast.error(response.message || "Set Score error");
        return;
      }
      toast.success("Score successfully updated!");
      setIsModalVisible(false);
      setRefresh((prev) => prev + 1);
    } catch (err) {
      toast.error("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (data) {
      setSelectedScore(data.data.score);
    }
  }, [data]);

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setErrorMessage("");
  };

  const checkAIAgain = async () => {
    const requestBody = {
      examId: id,
      userId: userId,
    };
    setIsLoading(true);
    try {
      const response = await apiClient.post(
        "api/v1/history/check",
        requestBody
      );
      if (response.code != 200) {
        toast.error(response.message || "Failed checking with AI");
        return;
      }
      setRefresh((prev) => prev + 1);
    } catch (err) {
      toast.error(err.message || "Error checking with AI");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = parseFloat(e.target.value);
    setSelectedScore(e.target.value);
    if (value < 0 || value > 9) {
      setErrorMessage("Score must be between 0.0 and 9.0");
    } else {
      setErrorMessage("");
    }
  };

  if (loading)
    return (
      <Layout
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
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

  return (
    <Layout
      style={{
        padding: "30px",
        borderRadius: "16px",
        background: "#ffffff",
      }}
    >
      {/* Score Modal */}
      <Modal
        title="📝 Writing Assessment"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okButtonProps={{ loading: isLoading, disabled: isLoading }}
      >
        <Typography.Text strong>
          Current Score: {selectedScore ?? "Not set"}
        </Typography.Text>
        <Input
          placeholder="Enter score between 0.0 and 9.0"
          value={selectedScore}
          onChange={handleInputChange}
          type="number"
          step="0.5"
          style={{ marginTop: "12px" }}
        />
        {errorMessage && (
          <Typography.Text type="danger" style={{ display: "block" }}>
            {errorMessage}
          </Typography.Text>
        )}
      </Modal>

      {/* Header */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
        <Typography.Title level={3}>🖊️ Writing History</Typography.Title>
        <Flex align="center" gap="large">
          <Typography.Text strong style={{ fontSize: "16px" }}>
            💯 Current Score: {selectedScore ?? "Not set"}
          </Typography.Text>
          <Tooltip title="Let AI check your writing for feedback">
            <Button
              type="primary"
              icon={<OpenAIOutlined />}
              loading={isLoading}
              onClick={() => checkAIAgain()}
              style={{
                background: "linear-gradient(90deg, #7b2ff7 0%, #f107a3 100%)",
                color: "#fff",
                border: "none",
                fontWeight: "600",
                fontSize: "16px",
                padding: "10px 28px",
                borderRadius: "12px",
                boxShadow: "0 4px 14px rgba(123, 47, 247, 0.4)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              AI Checking
            </Button>
          </Tooltip>
          <Button type="primary" onClick={() => setIsModalVisible(true)}>
            Set Score
          </Button>
        </Flex>
      </Flex>

      {/* Questions Rendering */}
      {data.data.questions.map((question) => {
        const answer = data.data.answers.find(
          (ans) => ans.writingId === question.id
        );

        return (
          <div
            key={question.id}
            style={{
              marginBottom: "32px",
              border: "1px solid #f0f0f0",
              padding: "24px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <Typography.Title level={4}>
              Task {question.task ? "One" : "Two"}
            </Typography.Title>
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <Typography.Title level={5}>Topic</Typography.Title>
                <Typography.Paragraph>{question.title}</Typography.Paragraph>
                {question.image && (
                  <img
                    src={question.image}
                    alt="task"
                    style={{
                      maxWidth: "100%",
                      borderRadius: "8px",
                      marginTop: "10px",
                    }}
                  />
                )}
              </Col>
              <Col xs={24} md={12}>
                <Typography.Title level={5}>User's Answer</Typography.Title>
                <div
                  style={{
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    padding: "12px",
                    background: "#fafafa",
                    minHeight: "300px",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {answer?.answer ? (
                    answer.answer
                  ) : (
                    <Typography.Text type="secondary">
                      No answer provided
                    </Typography.Text>
                  )}
                </div>
              </Col>
            </Row>
            {answer?.feedback && (
              <>
                <Divider />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <Typography.Title level={3}>Feedback:</Typography.Title>

                  <Typography.Text style={{ fontWeight: "bold", fontSize: 18 }}>
                    Overall: ({answer?.feedback.overall_band})
                  </Typography.Text>

                  {/* <Typography.Text
                    style={{ fontWeight: "normal", fontSize: 16 }}
                  >
                    {answer.feedback.summary}
                  </Typography.Text> */}
                  {answer?.feedback?.summary && <div >
                    <div>
                      <h3>Strengths:</h3>
                      <ul>
                        {answer.feedback.summary.strengths.map((item, index) => (
                          <li key={index} style={{ fontSize: 16 }}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3>Weaknesses:</h3>
                      <ul>
                        {answer.feedback.summary.weaknesses.map((item, index) => (
                          <li key={index} style={{ fontSize: 16 }}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    </div>}
                  <Typography.Text
                    style={{ fontWeight: "normal", fontSize: 16 }}
                  >
                    <b>Encouragement:</b> {answer.feedback.encouragement}{" "}
                    {answer?.feedback?.stickers?.map((stick, index) => (
                      <span key={index}>{stick} </span>
                    ))}
                  </Typography.Text>
                  {answer.feedback.task_response && (
                    <FeedbackBox
                      title={"Task Response"}
                      feedback={answer.feedback.task_response}
                    />
                  )}
                  {answer.feedback.task_achievement && (
                    <FeedbackBox
                      title={"Task Achievement"}
                      feedback={answer.feedback.task_achievement}
                    />
                  )}
                  {answer.feedback.coherence_and_cohesion && (
                    <FeedbackBox
                      title={"Coherence and cohesion"}
                      feedback={answer.feedback.coherence_and_cohesion}
                    />
                  )}
                  {answer.feedback.lexical_resource && (
                    <FeedbackBox
                      title={"Lexical Resource"}
                      feedback={answer.feedback.lexical_resource}
                    />
                  )}
                  {answer.feedback.grammatical_range_and_accuracy && (
                    <FeedbackBox
                      title={"Grammatical range and accuracy"}
                      feedback={answer.feedback.grammatical_range_and_accuracy}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}

      <Divider />
    </Layout>
  );
};

export default WritingWriting;
