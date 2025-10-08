import React, { useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Flex,
  List,
  Modal,
  Row,
  Space,
  Tag,
  Tooltip,
  Typography,
  Input,
} from "antd";
import {
  AudioOutlined,
  BranchesOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  EditOutlined,
  LoadingOutlined,
  ReadOutlined,
  ReloadOutlined,
  SoundOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import ScoreBox from "../../../components/ScoreBox";
import apiClient from "../../../services/api";
import { calculateDuration, formatDate } from "../../../utils/dateUtils";

const { Title, Text } = Typography;

const HistoryItemCard = ({ item, token, userId, userEmail, onRefresh }) => {
  const [selectTab, setSelectTab] = useState("booking");
  const [isSpeakingModalVisible, setIsSpeakingModalVisible] = useState(false);
  const [selectedSpeakingScore, setSelectedSpeakingScore] = useState(null);
  const [selectedSpeaking, setSelectedSpeaking] = useState();
  const [errorMessage, setErrorMessage] = useState("");
  const [speakingLoading, setSpeakingLoading] = useState(false);
  const [answerLoading, setAnswerLoading] = useState(false);

  const speakings = useMemo(() => item.speakings || [], [item.speakings]);
  const groups = useMemo(() => item.groups || [], [item.groups]);

  const sendAnswerToUser = async (result) => {
    if (!result.speaking) {
      toast.error("Please set speaking score!");
      return;
    }

    if (!result.writing) {
      toast.error("Please set writing score!");
      return;
    }

    setAnswerLoading(true);
    const requestBody = {
      userId,
      examId: result.id,
    };

    try {
      const response = await apiClient.post(
        "api/v1/history/send-answer",
        requestBody
      );

      if (response.code !== 200) {
        toast.error(
          response.message || "There was an error sending the answer"
        );
        return;
      }

      onRefresh?.();
    } catch (error) {
      toast.error(error.message || "There was an error sending the answer");
      console.error("Answer Error:", error);
    } finally {
      setAnswerLoading(false);
    }
  };

  const refreshExamAnswer = async (result) => {
    if (result.type === "booking") {
      toast.error("This session not pass exam");
      return;
    }

    setAnswerLoading(true);
    const requestBody = {
      userId,
      examId: result.id,
    };

    try {
      const response = await apiClient.post(
        "api/v1/history/refresh-answer",
        requestBody
      );

      if (response.code !== 200) {
        toast.error(
          response.message ||
            "There was some problem refreshing the answer"
        );
        return;
      }

      onRefresh?.();
    } catch (error) {
      toast.error(error.message || "There was an error refreshing the answer");
    } finally {
      setAnswerLoading(false);
    }
  };

  const downloadAnswers = async (result) => {
    if (result.type === "booking") {
      toast.error("This session not pass exam");
      return;
    }

    setAnswerLoading(true);
    try {
      const response = await apiClient.get(
        `api/v1/history/download/${result.id}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Mock Exam Answer ${result.startDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      const { response } = error;
      if (response?.status === 400) {
        toast.error(
          "Test is not completed! Please let the candidate finish before downloading answers."
        );
        setAnswerLoading(false);
        return;
      }

      toast.error("There was an error downloading the answer");
    } finally {
      setAnswerLoading(false);
    }
  };

  const handleSpeakingModalOk = async () => {
    if (errorMessage) {
      toast.error("Score must be between 0.0 and 9.0");
      return;
    }

    setSpeakingLoading(true);
    try {
      const response = await apiClient.post(
        `api/v1/booking/speaking-score?id=${selectedSpeaking?.id}&score=${selectedSpeakingScore}`
      );

      if (response.code !== 200) {
        toast.error(response.message || "Set score error");
        return;
      }

      setIsSpeakingModalVisible(false);
      setSelectedSpeaking(undefined);
      onRefresh?.();
    } catch (error) {
      toast.error(error.message || "Failed to set speaking score");
    } finally {
      setSpeakingLoading(false);
    }
  };

  const handleInputChange = (event) => {
    const { value } = event.target;
    const parsedValue = parseFloat(value);
    setSelectedSpeakingScore(value);

    if (Number.isNaN(parsedValue) || parsedValue < 0 || parsedValue > 9) {
      setErrorMessage("Score must be between 0.0 and 9.0");
    } else {
      setErrorMessage("");
    }
  };

  const handleSpeakingModalCancel = () => {
    setErrorMessage("");
    setSelectedSpeakingScore(null);
    setSelectedSpeaking(undefined);
    setIsSpeakingModalVisible(false);
  };

  const openSpeakingModal = (speaking) => {
    setSelectedSpeakingScore(speaking?.score || null);
    setSelectedSpeaking(speaking);
    setIsSpeakingModalVisible(true);
  };

  return (
    <Card
      title={
        <div
          style={{ display: "flex", alignItems: "center", gap: "20px" }}
        >
          <Title
            level={3}
            style={{
              fontWeight: "bold",
              margin: 0,
              color: token.colorPrimary,
            }}
          >
            {item.mockPackages.name}
          </Title>
          <Text>
            <CalendarOutlined /> Registered Date: {formatDate(item.date)}
          </Text>
          <Button
            type={selectTab === "booking" ? "primary" : "default"}
            onClick={() => setSelectTab("booking")}
          >
            Total Session: {item.mockPackages.totalSessions}
          </Button>
          <Button
            type={selectTab === "speaking" ? "primary" : "default"}
            onClick={() => setSelectTab("speaking")}
          >
            Speaking Session: {item.mockPackages.speakingSessions}
          </Button>
        </div>
      }
      variant="borderless"
      style={{ borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
    >
      {selectTab === "speaking" && (
        <List
          grid={{ gutter: 24, column: 1 }}
          dataSource={speakings}
          renderItem={(speaking) => (
            <List.Item>
              <Card
                title={
                  <Flex justify="space-between" align="center" gap={20}>
                    <p>Speaking Details</p>
                    <p>
                      Current Score: {speaking?.score || "0.0"} score
                    </p>
                  </Flex>
                }
                variant="borderless"
              >
                <Space
                  direction="horizontal"
                  size="middle"
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Space direction="horizontal" size="middle" style={{ width: "100%" }}>
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <Flex gap={10} align="center">
                        <Text strong>Date:</Text>
                        <Tag color="blue">{speaking?.date || "N/A"}</Tag>
                      </Flex>
                      <Flex gap={10} align="center">
                        <Text strong>Time:</Text>
                        <Tag color="blue">{speaking?.time || "N/A"}</Tag>
                      </Flex>
                    </Space>
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <Flex gap={10} align="center">
                        <Text strong>Branch:</Text>
                        <Text>{speaking?.branchName || "N/A"}</Text>
                      </Flex>
                      <Flex gap={10} align="center">
                        <Text strong>Speaking Examiner Name:</Text>
                        <Text>{speaking?.speakerName || "N/A"}</Text>
                      </Flex>
                    </Space>
                  </Space>
                  <Button type="primary" onClick={() => openSpeakingModal(speaking)}>
                    Set speaking score
                  </Button>
                </Space>
              </Card>
            </List.Item>
          )}
        />
      )}

      {selectTab === "booking" && (
        <List
          grid={{ gutter: 24, column: 1 }}
          dataSource={groups}
          renderItem={(group) => (
            <List.Item>
              <Card
                title={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text>
                      <CalendarOutlined /> Speaking Date for Sessions Booked:
                      {" "}
                      {formatDate(group.date)}
                    </Text>
                    <Text>
                      <BranchesOutlined /> Branch: {group.branchName}
                    </Text>
                    <Text>Speaking Examiner: {group.speakerName}</Text>
                  </div>
                }
              >
                <List
                  grid={{ gutter: 24, column: 1 }}
                  dataSource={group.examResponses || []}
                  renderItem={(result) => {
                    const today = new Date().toDateString();
                    const testDate = new Date(result.testDate).toDateString();
                    const isBeforeDate = new Date(testDate) >= new Date(today);

                    return (
                      <List.Item>
                        {result.type === "mock_exam" ? (
                          <Card
                            title={
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "start",
                                  width: "100%",
                                }}
                              >
                                <Space direction="vertical">
                                  <Flex align="center" gap={10}>
                                    <Text strong>Payment Status:</Text>
                                    <Text>{result.paymentStatus || "N/A"}</Text>
                                  </Flex>
                                  {result.status && (
                                    <Flex
                                      justify="space-between"
                                      align="center"
                                      gap={10}
                                    >
                                      {result.status === "success" ? (
                                        <>
                                          <p>Email sent:</p>
                                          <CheckCircleOutlined
                                            style={{
                                              color: token.colorPrimary,
                                              fontSize: 20,
                                            }}
                                          />
                                        </>
                                      ) : result.status === "waiting" ? (
                                        <>
                                          <p>Email waiting:</p>
                                          <LoadingOutlined
                                            style={{
                                              color: token.colorError,
                                              fontSize: 20,
                                            }}
                                          />
                                        </>
                                      ) : (
                                        <>
                                          <p>Email sent:</p>
                                          <CloseCircleOutlined
                                            style={{
                                              color: token.colorError,
                                              fontSize: 20,
                                            }}
                                          />
                                        </>
                                      )}
                                    </Flex>
                                  )}
                                  {result.smsStatus && (
                                    <Flex
                                      justify="space-between"
                                      align="center"
                                      gap={10}
                                    >
                                      {result.smsStatus === "success" ? (
                                        <>
                                          <p>Sms sent:</p>
                                          <CheckCircleOutlined
                                            style={{
                                              color: token.colorPrimary,
                                              fontSize: 20,
                                            }}
                                          />
                                        </>
                                      ) : result.smsStatus === "waiting" ? (
                                        <>
                                          <p>Sms waiting:</p>
                                          <LoadingOutlined
                                            style={{
                                              color: token.colorError,
                                              fontSize: 20,
                                            }}
                                          />
                                        </>
                                      ) : (
                                        <>
                                          <p>Sms sent:</p>
                                          <CloseCircleOutlined
                                            style={{
                                              color: token.colorError,
                                              fontSize: 20,
                                            }}
                                          />
                                        </>
                                      )}
                                    </Flex>
                                  )}
                                </Space>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 12,
                                    alignItems: "center",
                                  }}
                                >
                                  <Tooltip title="Recalculate the student's answer">
                                    <Button
                                      icon={<ReloadOutlined />}
                                      loading={answerLoading}
                                      onClick={() => refreshExamAnswer(result)}
                                    />
                                  </Tooltip>
                                  <Tooltip title="Download the candidate's answer">
                                    <Button
                                      icon={<DownloadOutlined />}
                                      loading={answerLoading}
                                      onClick={() => downloadAnswers(result)}
                                    >
                                      Download
                                    </Button>
                                  </Tooltip>
                                  <Tooltip title="Send to user his answer">
                                    <Button
                                      type="primary"
                                      disabled={!userEmail}
                                      onClick={() => sendAnswerToUser(result)}
                                      loading={answerLoading}
                                    >
                                      Send answer
                                    </Button>
                                  </Tooltip>
                                </div>
                              </div>
                            }
                          >
                            <Row justify="space-between" align="top">
                              <Col>
                                <Space
                                  style={{
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "flex-start",
                                    flexDirection: "column",
                                    alignItems: "flex-start",
                                  }}
                                >
                                  <Text>
                                    <BranchesOutlined /> Branch: {" "}
                                    <span style={{ fontWeight: "bold" }}>
                                      {result.branchName}
                                    </span>
                                  </Text>
                                  <Text>
                                    <ClockCircleOutlined /> Duration: {" "}
                                    <span style={{ color: token.colorPrimary }}>
                                      {calculateDuration(
                                        result.startDate,
                                        result.endDate
                                      )}
                                    </span>
                                  </Text>
                                  <Text style={{ fontWeight: "bold" }}>
                                    <ClockCircleOutlined /> Test Time: {" "}
                                    <span style={{ color: token.colorPrimary }}>
                                      {result.time}
                                    </span>
                                  </Text>
                                  <Text
                                    style={{
                                      textAlign: "start",
                                      fontWeight: 600,
                                      color: token.colorPrimary,
                                    }}
                                  >
                                    {result.examStatus}
                                  </Text>
                                  <Link
                                    to={`/dashboard/contest/${result.bookingId}/TEST`}
                                  >
                                    <Button type="primary">
                                      View booking detail
                                    </Button>
                                  </Link>
                                </Space>
                              </Col>
                              <Col>
                                <Space>
                                  <ScoreBox
                                    id={result.id}
                                    icon={<SoundOutlined />}
                                    label="Listening"
                                    score={result.listening}
                                    userId={userId}
                                    setRefresh={onRefresh}
                                  />
                                  <ScoreBox
                                    id={result.id}
                                    icon={<ReadOutlined />}
                                    label="Reading"
                                    score={result.reading}
                                    userId={userId}
                                    setRefresh={onRefresh}
                                  />
                                  <ScoreBox
                                    id={result.id}
                                    icon={<EditOutlined />}
                                    label="Writing"
                                    score={result.writing}
                                    userId={userId}
                                    setRefresh={onRefresh}
                                  />
                                  <ScoreBox
                                    id={result.id}
                                    icon={<AudioOutlined />}
                                    label="Speaking"
                                    score={result.speaking}
                                    userId={userId}
                                    setRefresh={onRefresh}
                                  />
                                </Space>
                              </Col>
                            </Row>
                          </Card>
                        ) : (
                          <Card>
                            <Row justify="space-between" align="top">
                              <Col>
                                <Space
                                  style={{
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "flex-start",
                                    flexDirection: "column",
                                    alignItems: "flex-start",
                                  }}
                                >
                                  <Text>
                                    <BranchesOutlined /> Branch: {" "}
                                    <span style={{ fontWeight: "bold" }}>
                                      {result.branchName}
                                    </span>
                                  </Text>
                                  <Text style={{ fontWeight: "bold" }}>
                                    <ClockCircleOutlined /> Test Date: {" "}
                                    <span
                                      style={{
                                        color: !isBeforeDate
                                          ? token.colorError
                                          : token.colorPrimary,
                                      }}
                                    >
                                      {formatDate(result.testDate)}
                                    </span>
                                  </Text>
                                  <Text style={{ fontWeight: "bold" }}>
                                    <ClockCircleOutlined /> Test Time: {" "}
                                    <span
                                      style={{
                                        color: !isBeforeDate
                                          ? token.colorError
                                          : token.colorPrimary,
                                      }}
                                    >
                                      {result.time}
                                    </span>
                                  </Text>
                                  <Text
                                    style={{
                                      textAlign: "start",
                                      fontWeight: 600,
                                      color: !isBeforeDate
                                        ? token.colorError
                                        : token.colorPrimary,
                                    }}
                                  >
                                    {!isBeforeDate
                                      ? "The student did not pass the exam"
                                      : "Exam is waiting"}
                                  </Text>
                                  <Link to={`/dashboard/contest/${result.id}/TEST`}>
                                    <Button type="primary">
                                      View booking detail
                                    </Button>
                                  </Link>
                                </Space>
                              </Col>
                              <Col>
                                <Space>
                                  <ScoreBox
                                    id={result.id}
                                    icon={<SoundOutlined />}
                                    label="Listening"
                                    score={result.listening}
                                    userId={userId}
                                    setRefresh={onRefresh}
                                    booking
                                    isBeforeDate={isBeforeDate}
                                  />
                                  <ScoreBox
                                    id={result.id}
                                    icon={<ReadOutlined />}
                                    label="Reading"
                                    score={result.reading}
                                    userId={userId}
                                    setRefresh={onRefresh}
                                    booking
                                    isBeforeDate={isBeforeDate}
                                  />
                                  <ScoreBox
                                    id={result.id}
                                    icon={<EditOutlined />}
                                    label="Writing"
                                    score={result.writing}
                                    userId={userId}
                                    setRefresh={onRefresh}
                                    booking
                                    isBeforeDate={isBeforeDate}
                                  />
                                  <ScoreBox
                                    id={result.id}
                                    icon={<AudioOutlined />}
                                    label="Speaking"
                                    score={result.speaking}
                                    userId={userId}
                                    setRefresh={onRefresh}
                                    booking
                                    isBeforeDate={isBeforeDate}
                                  />
                                </Space>
                              </Col>
                            </Row>
                          </Card>
                        )}
                      </List.Item>
                    );
                  }}
                />
              </Card>
            </List.Item>
          )}
        />
      )}

      <Modal
        title={
          <p>
            Set Speaking Score for <b>{selectedSpeaking?.date}</b>
          </p>
        }
        open={isSpeakingModalVisible}
        confirmLoading={speakingLoading}
        onOk={handleSpeakingModalOk}
        okButtonProps={{
          disabled: speakingLoading,
        }}
        onCancel={handleSpeakingModalCancel}
      >
        <p>Current Speaking Score: {selectedSpeakingScore ?? "0.0"}</p>
        <Input
          min={0.0}
          max={9.0}
          value={selectedSpeakingScore}
          placeholder="Enter new speaking score (5.5)"
          type="number"
          onChange={handleInputChange}
        />
        {errorMessage && (
          <p style={{ color: "red", marginTop: "10px" }}>{errorMessage}</p>
        )}
      </Modal>
    </Card>
  );
};

export default HistoryItemCard;
