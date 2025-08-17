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
} from "antd";
import { toast } from "react-toastify";
import apiClient from "../../services/api";

const WritingWriting = () => {
  const { userId, id } = useParams();

  const { data, loading, error } = useApiRequest(
    `api/v1/history/mock-exam/${id}?type=writing`,
    [id]
  );

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedScore, setSelectedScore] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);

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

  const handleInputChange = (e) => {
    const value = parseFloat(e.target.value);
    setSelectedScore(e.target.value);
    if (value < 0 || value > 9) {
      setErrorMessage("Score must be between 0.0 and 9.0");
    } else {
      setErrorMessage("");
    }
  };

  const getCount = (text) => {
    if (!text) return 0;
    const words = text.trim().split(/\s+/);
    return words.length;
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
          <Button type="primary" onClick={() => setIsModalVisible(true)}>
            Set Score
          </Button>
        </Flex>
      </Flex>

      {/* Questions Rendering */}
      {data.data.questions.map((question, index) => {
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
                <Typography.Text level={5} style={{ marginTop: "12px" }}>
                  Word count: {getCount(answer?.answer)}
                </Typography.Text>
              </Col>
            </Row>
          </div>
        );
      })}

      <Divider />
    </Layout>
  );
};

export default WritingWriting;
