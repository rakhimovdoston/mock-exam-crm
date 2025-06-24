import React, { useEffect, useState } from "react";
import useApiRequest from "../../hooks/useApiRequest";
import { useNavigate, useParams } from "react-router-dom";
import { Layout, Button, Modal, Spin, Card, Input } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import apiClient from "../../services/api";

const { Header, Footer, Content } = Layout;

const WritingExam = () => {
  const { id } = useParams();
  const [task, setTask] = useState(true);
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [answers, setAnswers] = useState([]);
  const navigate = useNavigate();
  const [saveLoading, setSaveLoading] = useState(false);
  const [content, setContent] = useState();
  const { data, error, loading } = useApiRequest(
    `api/v1/exam/module/${id}?moduleType=writing`
  );

  useEffect(() => {
    if (data && data?.data) {
      const filteredQuestions = data?.data?.filter(
        (question) => question.task === task
      );

      setContent(filteredQuestions[0]);
    }
  }, [data?.data, task]);

  useEffect(() => {
    if (data && data?.data) {
      const initAnswers = data.data.map((item) => {
        return {
          id: item.id,
          task: item.task,
          answer: "",
        };
      });

      setAnswers(initAnswers);
    }
  }, [data]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setIsModalVisible(true); // Show modal when timeLeft reaches 0
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const handleModalOk = async () => {
    setSaveLoading(true);
    const request = {
      answers: answers,
    };
    try {
      const response = await apiClient.post(
        `/api/v1/exam/writing/${id}`,
        request
      );
      if (response.code !== 200) {
        toast.error(
          response.message || "Failed to submit answers. Please try again."
        );
        return;
      }
      toast.success("Answers submitted successfully!");
      navigate("/exam");
    } catch (error) {
      console.error("Error submitting answers:", error);
      toast.error("Failed to submit answers. Please try again.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const getWordCount = () => {
    if (answers.length === 0) return 0;
    const text = answers.find((ans) => ans.task === task);
    return text && text.answer.trim()
      ? text.answer.trim().split(/\s+/).length
      : 0;
  };

  const getValue = () => {
    return answers.find((ans) => ans.task === task)?.answer || "";
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <h2>Error loading exam data</h2>
      </div>
    );
  }

  return (
    <Layout style={{ position: "relative", height: "100vh" }}>
      <>
        <Header
          style={{
            textAlign: "center",
            position: "sticky",
            top: 0,
            background: "white",
            boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "20px", fontWeight: 700 }}>
              Writing Test
            </span>
            <span
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <ClockCircleOutlined style={{ fontSize: "16px" }} />
              {formatTime(timeLeft)}
            </span>
            <Button
              type="primary"
              style={{ fontWeight: "bold" }}
              onClick={() => setIsModalVisible(true)}
            >
              Submit
            </Button>
          </div>
        </Header>
        <Modal
          title="Time's Up!"
          open={isModalVisible}
          closable={timeLeft > 0}
          footer={[
            <Button
              key="submit"
              type="primary"
              onClick={handleModalOk}
              loading={saveLoading}
            >
              Submit
            </Button>,
            <Button
              key="cancel"
              onClick={handleModalCancel}
              disabled={timeLeft <= 0}
            >
              Cancel
            </Button>,
          ]}
          centered
        >
          <p>Your time for this test has ended. Please submit your answers.</p>
        </Modal>
      </>
      <Content style={{ padding: "40px", overflowY: "auto" }}>
        <div style={{ display: "flex", gap: "20px" }}>
          {content && (
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>
                {content.task ? "Writing Task 1" : "Writing Task 2"}
              </h2>
              <Input.TextArea
                value={content.title}
                readOnly
                style={{ fontSize: "18px", fontWeight: 600, height: "180px" }}
              />
              <p></p>
              {content.image && (
                <img
                  src={content.image}
                  alt="Task"
                  style={{ maxWidth: "100%" }}
                />
              )}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <h2 style={{fontSize: "16px", fontWeight: "bold"}}>Enter here your answers:</h2>
            <Input.TextArea
              value={getValue()}
              onChange={(e) => {
                const updatedAnswers = answers.map((ans) =>
                  ans.task === task ? { ...ans, answer: e.target.value } : ans
                );
                setAnswers(updatedAnswers);
              }}
              style={{ width: "100%", minHeight: "400px", fontSize: "16px" }}
              placeholder="Enter here writing task your opition"
            />
            <p>Word Count: {getWordCount()}</p>
          </div>
        </div>
      </Content>

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
        {data.data.map((answer, index) => (
          <Card
            key={index}
            onClick={() => setTask(answer.task)}
            style={{
              height: "50px",
              flex: 1,
              border: `1px solid ${
                task === answer.task ? "#1890ff" : "#d9d9d9"
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
            {answer.task ? "Writing Task 1" : "Writing Task 2"}
          </Card>
        ))}
      </Footer>
    </Layout>
  );
};

export default WritingExam;
