import React, { useEffect, useState } from "react";
import useApiRequest from "../../hooks/useApiRequest";
import { useNavigate, useParams } from "react-router-dom";
import {
  Layout,
  Button,
  Modal,
  Spin,
  Card,
  Input,
  Splitter,
  Result,
} from "antd";
import {
  ClockCircleOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import apiClient from "../../services/api";
import { enterFullScreen, isFullScreen } from "../../utils/documentUtils";
import { logo } from "../../assets";

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
          setTimeout(() => {
            handleModalOk();
          }, 2000);
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
    return (
      <span>
        <span style={{ fontWeight: "bold" }}>
          {minutes > 0
            ? minutes.toString().padStart(2, "0")
            : seconds.toString().padStart(2, "0")}
        </span>{" "}
        {minutes > 0 ? "minutes" : "seconds"} remaining
      </span>
    );
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl yoki Meta (Mac uchun ⌘) bilan bosilgan tugmalarni bloklash
      if (
        (e.ctrlKey || e.metaKey) &&
        ["c", "v", "x", "a", "s", "p", "r", "t"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        toast.info(`This keyboard blocked:`);
      }

      // F12 (developer tools), PrintScreen, va boshqalarni ham bloklash mumkin
      if (e.key === "F12" || e.key === "PrintScreen") {
        e.preventDefault();
        toast.info(`This keyboard blocked:`);
      }
    };

    const handlePaste = (e) => {
      e.preventDefault();
      toast.info(`Paste is blocked:`);
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      toast.info("Context Menu bloklangan:");
    };

    const handleCopy = (e) => {
      e.preventDefault();
      toast.info(`Copy is Blocked:`);
    };

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("copy", handleCopy);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("contextmenu", handleContextMenu);
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
      navigate(`/exam/${id}`);
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
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {/* {type === "reading" ? "Reading Test" : "Listening Test"} */}
              <img src={logo} alt="Logo" width={100} />
            </div>
            <span
              style={{
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <ClockCircleOutlined style={{ fontSize: "16px" }} />
              {formatTime(timeLeft)}
            </span>
            <div style={{ display: "flex", gap: 10 }}>
              <Button
                onClick={enterFullScreen}
                icon={
                  isFullScreen() ? (
                    <FullscreenExitOutlined />
                  ) : (
                    <FullscreenOutlined />
                  )
                }
              />
              <Button
                type="primary"
                style={{ fontWeight: "bold" }}
                onClick={() => setIsModalVisible(true)}
              >
                Submit
              </Button>
            </div>
          </div>
        </Header>
        <Modal
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
          <Result title="Are you sure you want to submit?" />
        </Modal>
      </>
      <Content style={{ padding: "40px", overflowY: "auto" }}>
        <Splitter style={{ display: "flex", gap: "20px" }}>
          {content && (
            <Splitter.Panel defaultSize={"50%"} min={"30%"} max={"70%"}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>
                {content.task ? "Writing Task 1" : "Writing Task 2"}
              </h2>
              <p
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  height: "180px",
                  overflowY: "auto",
                  whiteSpace: "pre-wrap",
                  borderRadius: "4px",
                }}
              >
                {content.title}
              </p>
              <p></p>
              {content.image && (
                <img
                  src={content.image}
                  alt="Task"
                  style={{ maxWidth: "100%" }}
                />
              )}
            </Splitter.Panel>
          )}
          <Splitter.Panel style={{ flex: 1 }}>
            <h2 style={{ fontSize: "16px", fontWeight: "bold" }}>
              Enter here your answers:
            </h2>
            <Input.TextArea
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              value={getValue()}
              onChange={(e) => {
                const updatedAnswers = answers.map((ans) =>
                  ans.task === task ? { ...ans, answer: e.target.value } : ans
                );
                setAnswers(updatedAnswers);
              }}
              style={{ width: "100%", minHeight: "400px", fontSize: "16px" }}
              placeholder={`Enter here writing task ${
                content && content.task ? "one" : "two"
              } your opition`}
            />
            <p>Word Count: {getWordCount()}</p>
          </Splitter.Panel>
        </Splitter>
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
