import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Spin,
  Typography,
  Card,
  List,
  Row,
  Col,
  Divider,
  Space,
  Input,
  Button,
  Form,
  theme,
  Tooltip,
  Flex,
  Tag,
  Modal,
} from "antd";
import {
  ReadOutlined,
  SoundOutlined,
  EditOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  AudioOutlined,
  ReloadOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  BranchesOutlined,
  LoadingOutlined,
} from "@ant-design/icons";

import useApiRequest from "../../hooks/useApiRequest";
import { toast } from "react-toastify";
import apiClient from "../../services/api";
import { MaskedInput } from "antd-mask-input";
import ScoreBox from "../../components/ScoreBox";
import { calculateDuration, formatDate } from "../../utils/dateUtils";

const { Title, Text } = Typography;

const LoadingSpinner = () => (
  <div
    style={{
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <Spin size="large" />
  </div>
);

const UserDetails = () => {
  const { id } = useParams();

  const { token } = theme.useToken();
  const [refresh, setRefresh] = useState(1);
  const [questionRefresh, setQuestionRefresh] = useState(1);
  const { data, loading } = useApiRequest(`api/v1/admin/user/by/${id}`, [
    id,
    refresh,
  ]);
  const { data: historyData, loading: historyLoading } = useApiRequest(
    `api/v1/booking/by-user?userId=${id}`,
    [id, questionRefresh]
  );

  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  if (loading) return <LoadingSpinner />;

  const user = data?.data;
  const history = historyData?.data || [];

  const handleEdit = () => {
    setIsEditing(true);
    form.setFieldsValue({
      firstname: user?.firstname,
      lastname: user?.lastname,
      email: user?.email,
      username: user?.username,
      password: user?.password,
      phone: user?.phone,
    });
  };

  const handleSave = async (values) => {
    try {
      const response = await apiClient.put(
        `api/v1/admin/user/update/${id}`,
        values
      );
      if (response.code != 200) {
        toast.error(response.message || "Failed to update to user details");
        return;
      }
      toast.success("Successfull update user details!");
      setRefresh((prev) => prev + 1);
      setIsEditing(false);
    } catch (error) {
      toast.error(error.message || "Failed to update user details:");
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <Card
        variant={"borderless"}
        style={{
          maxWidth: 600,
          borderRadius: "12px",
        }}
      >
        <Space direction="vertical" style={{ width: "100%" }} align="start">
          {isEditing ? (
            <Form form={form} onFinish={handleSave} layout="vertical">
              <h2>Update User details:</h2>
              <div style={{ display: "flex", width: "100%", gap: "10px" }}>
                <Form.Item
                  label="First Name"
                  style={{ flex: 1 }}
                  name="firstname"
                  rules={[
                    { required: true, message: "First name is required" },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  style={{ flex: 1 }}
                  label="Last Name"
                  name="lastname"
                  rules={[{ required: true, message: "Last name is required" }]}
                >
                  <Input />
                </Form.Item>
              </div>
              <div style={{ display: "flex", width: "100%", gap: "10px" }}>
                <Form.Item label="Email" style={{ flex: 1 }} name="email">
                  <Input />
                </Form.Item>
                <Form.Item
                  name="phone"
                  label="Phone"
                  rules={[
                    {
                      required: true,
                      message: "Please enter your phone number!",
                    },
                    {
                      pattern: /^\+998 \(\d{2}\) \d{3}-\d{2}-\d{2}$/,
                      message: "Invalid phone number format",
                    },
                  ]}
                >
                  <MaskedInput
                    mask="+998 (00) 000-00-00"
                    placeholder="+998 (__) ___-__-__"
                  />
                </Form.Item>
              </div>
              <div style={{ display: "flex", width: "100%", gap: "10px" }}>
                <Form.Item
                  label="Username"
                  style={{ flex: 1 }}
                  name="username"
                  rules={[{ required: true, message: "Login is required" }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="Password"
                  name="password"
                  rules={[{ required: true, message: "Password is required" }]}
                >
                  <Input.Password />
                </Form.Item>
              </div>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={updateLoading}
                  disabled={updateLoading}
                >
                  Save
                </Button>
                <Button onClick={() => setIsEditing(false)}>Cancel</Button>
              </Space>
            </Form>
          ) : (
            <>
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <Typography>Full name:</Typography>
                <Title level={3} style={{ margin: 0 }}>
                  {user?.firstname} {user?.lastname}
                </Title>
              </div>
              <Text>
                Email: <b>{user?.email}</b>
              </Text>
              <Text>
                Phone: <b>{user?.phone}</b>
              </Text>
              <Text>
                Login: <b>{user?.username}</b>
              </Text>
              <Text>
                Password: <b>{user?.password}</b>
              </Text>
              <Button type="primary" onClick={handleEdit}>
                Edit Details
              </Button>
            </>
          )}
        </Space>
      </Card>

      <Divider>Booking and Test History</Divider>

      {historyLoading ? (
        <Spin />
      ) : (
        <List
          loading={historyLoading}
          grid={{ gutter: 24, column: 1 }}
          dataSource={history}
          renderItem={(item) => {
            const [selectTab, setSelectTab] = useState("booking");
            const [isSpeakingModalVisible, setIsSpeakingModalVisible] =
              useState(false);
            const [selectedSpeakingScore, setSelectedSpeakingScore] =
              useState(null);
            const [selectedSpeaking, setSelectedSpeaking] = useState();
            const [errorMessage, setErrorMessage] = useState("");
            const [speakingLoading, setSpeakingLoading] = useState(false);
            const [answerLoading, setAnswerLoading] = useState(false);
            const sendAnswerToUser = async (item) => {
              if (!item.speaking) {
                toast.error("Please set speaking score!");
                return;
              }

              if (!item.writing) {
                toast.error("Please set writing score!");
                return;
              }

              setAnswerLoading(true);
              const requestBody = {
                userId: id,
                examId: item.id,
              };
              try {
                const response = await apiClient.post(
                  `api/v1/history/send-answer`,
                  requestBody
                );
                if (response.code !== 200) {
                  toast.error(
                    response.message || "There was an error sending the answer"
                  );
                  return;
                }

                setQuestionRefresh((prev) => prev + 1);
              } catch (err) {
                toast.error(
                  err.message || "There was an error sending the answer"
                );
                console.log("Answer Error: ", err);
              } finally {
                setAnswerLoading(false);
              }
            };

            const refreshExamAnswer = async (item) => {
              if (item.type === "booking") {
                toast.error("This session not pass exam");
                return;
              }
              setAnswerLoading(true);
              const requestBody = {
                userId: id,
                examId: item.id,
              };
              try {
                const response = await apiClient.post(
                  "api/v1/history/refresh-answer",
                  requestBody
                );

                if (response.code != 200) {
                  toast.error(
                    response.message ||
                      "There was an some problem refresh the answer"
                  );
                  return;
                }
                setQuestionRefresh((prev) => prev + 1);
              } catch (err) {
                toast.error(
                  err.message || "There was an error refresh the answer"
                );
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
                  toast.error(response.message || "Set Score some error");
                  return;
                }
                setIsSpeakingModalVisible(false);
                setQuestionRefresh((prev) => prev + 1);
                setSelectedSpeaking();
              } catch (err) {
              } finally {
                setSpeakingLoading(false);
              }
            };

            const handleInputChange = (e) => {
              const value = parseFloat(e.target.value);
              setSelectedSpeakingScore(e.target.value);
              if (value < 0 || value > 9) {
                setErrorMessage("Score must be between 0.0 and 9.0");
              } else {
                setErrorMessage("");
              }
            };

            const handleSpeakingModalCancel = () => {
              setErrorMessage("");
              setSelectedSpeakingScore(null);
              setSelectedSpeaking();
              setIsSpeakingModalVisible(false);
            };

            return (
              <List.Item>
                <Card
                  title={
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                      }}
                    >
                      <Title
                        level={3}
                        style={{
                          fontWeight: "bold",
                          margin: "0",
                          color: token.colorPrimary,
                        }}
                      >
                        {item.mockPackages.name}
                      </Title>
                      <Text>
                        <CalendarOutlined /> Registered Date:{" "}
                        {formatDate(item.date)}
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
                  variant={"borderless"}
                  style={{
                    borderRadius: "10px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                >
                  {selectTab === "speaking" && (
                    <List
                      grid={{ gutter: 24, column: 1 }}
                      dataSource={item.speakings}
                      renderItem={(speaking) => (
                        <List.Item>
                          <Card
                            title={
                              <Flex
                                justify="space-between"
                                align="center"
                                gap={20}
                              >
                                <p>Speaking Details</p>
                                <p>
                                  Current Score: {speaking?.score || "0.0"}{" "}
                                  score
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
                              <Space
                                direction="horizontal"
                                size="middle"
                                style={{ width: "100%" }}
                              >
                                <Space
                                  direction="vertical"
                                  style={{ width: "100%" }}
                                >
                                  <Flex gap={10} align="center">
                                    <Text strong>Date:</Text>
                                    <Tag color="blue">
                                      {speaking?.date || "N/A"}
                                    </Tag>
                                  </Flex>
                                  <Flex gap={10} align="center">
                                    <Text strong>Time:</Text>
                                    <Tag color="blue">
                                      {speaking?.time || "N/A"}
                                    </Tag>
                                  </Flex>
                                </Space>
                                <Space
                                  direction="vertical"
                                  style={{ width: "100%" }}
                                >
                                  <Flex gap={10} align="center">
                                    <Text strong>Branch:</Text>
                                    <Text>{speaking?.branchName || "N/A"}</Text>
                                  </Flex>
                                  <Flex gap={10} align="center">
                                    <Text strong>Speaking Examiner Name:</Text>
                                    <Text>
                                      {speaking?.speakerName || "N/A"}
                                    </Text>
                                  </Flex>
                                </Space>
                              </Space>
                              <Button
                                type="primary"
                                onClick={() => {
                                  setIsSpeakingModalVisible(true);

                                  setSelectedSpeakingScore(
                                    speaking?.score || null
                                  );
                                  setSelectedSpeaking(speaking);
                                }}
                              >
                                Set speaking score
                              </Button>
                              <Modal
                                title={
                                  <p>
                                    Set Speaking Score for{" "}
                                    <b>{selectedSpeaking?.date}</b>
                                  </p>
                                }
                                open={isSpeakingModalVisible}
                                loading={speakingLoading}
                                onOk={handleSpeakingModalOk}
                                okButtonProps={{
                                  disabled: loading,
                                  loading: loading,
                                }}
                                onCancel={handleSpeakingModalCancel}
                              >
                                <p>
                                  Current Speaking Score:{" "}
                                  {selectedSpeakingScore ?? "0.0"}
                                </p>
                                <Input
                                  min={0.0}
                                  max={9.0}
                                  value={selectedSpeakingScore}
                                  placeholder="Enter new speaking score (5.5)"
                                  type="number"
                                  onChange={handleInputChange}
                                />
                                {errorMessage && (
                                  <p
                                    style={{ color: "red", marginTop: "10px" }}
                                  >
                                    {errorMessage}
                                  </p>
                                )}
                              </Modal>
                            </Space>
                          </Card>
                        </List.Item>
                      )}
                    />
                  )}
                  {selectTab === "booking" && (
                    <List
                      grid={{ gutter: 24, column: 1 }}
                      dataSource={item.groups}
                      renderItem={(group) => {
                        // Get exam responses from group instead of results
                        const examResponses = group.examResponses || [];

                        return (
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
                                    <CalendarOutlined /> Speaking Date for Sessions Booked:{" "}
                                    {formatDate(group.date)}
                                  </Text>
                                  <Text>
                                    <BranchesOutlined /> Branch:{" "}
                                    {group.branchName}
                                  </Text>
                                  <Text>Speaking Examiner: {group.speakerName}</Text>
                                </div>
                              }
                            >
                              <List
                                grid={{ gutter: 24, column: 1 }}
                                dataSource={examResponses}
                                renderItem={(result) => {
                                  const today = new Date().toDateString();
                                  const testDate = new Date(
                                    result.testDate
                                  ).toDateString();

                                  const isBeforeDate =
                                    new Date(testDate) >= new Date(today);

                                  return (
                                    <List.Item>
                                      {result.type === "mock_exam" ? (
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
                                                <CalendarOutlined /> Test Date:{" "}
                                                {formatDate(result.testDate)}
                                              </Text>
                                              <div
                                                style={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: 10,
                                                }}
                                              >
                                                {result.status && (
                                                  <Flex
                                                    justify="space-between"
                                                    align="center"
                                                    gap={10}
                                                  >
                                                    {result.status ===
                                                    "success" ? (
                                                      <>
                                                        <p>Email sent: </p>
                                                        <CheckCircleOutlined
                                                          style={{
                                                            color:
                                                              token.colorPrimary,
                                                            fontSize: 20,
                                                          }}
                                                        />
                                                      </>
                                                    ) : result.status ===
                                                      "waiting" ? (
                                                      <>
                                                        <p>Email waiting:</p>
                                                        <LoadingOutlined
                                                          style={{
                                                            color:
                                                              token.colorError,
                                                            fontSize: 20,
                                                          }}
                                                        />
                                                      </>
                                                    ) : (
                                                      <>
                                                        <p>Email sent:</p>
                                                        <CloseCircleOutlined
                                                          style={{
                                                            color:
                                                              token.colorError,
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
                                                    {result.smsStatus ===
                                                    "success" ? (
                                                      <>
                                                        <p>Sms sent: </p>
                                                        <CheckCircleOutlined
                                                          style={{
                                                            color:
                                                              token.colorPrimary,
                                                            fontSize: 20,
                                                          }}
                                                        />
                                                      </>
                                                    ) : result.smsStatus ===
                                                      "waiting" ? (
                                                      <>
                                                        <p>Sms waiting:</p>
                                                        <LoadingOutlined
                                                          style={{
                                                            color:
                                                              token.colorError,
                                                            fontSize: 20,
                                                          }}
                                                        />
                                                      </>
                                                    ) : (
                                                      <>
                                                        <p>Sms sent: </p>
                                                        <CloseCircleOutlined
                                                          style={{
                                                            color:
                                                              token.colorError,
                                                            fontSize: 20,
                                                          }}
                                                        />
                                                      </>
                                                    )}
                                                  </Flex>
                                                )}
                                                <Tooltip title="Recalculate the student's answer">
                                                  <Button
                                                    icon={<ReloadOutlined />}
                                                    loading={answerLoading}
                                                    onClick={() =>
                                                      refreshExamAnswer(result)
                                                    }
                                                  />
                                                </Tooltip>
                                                <Tooltip title="Send to user his answer">
                                                  <Button
                                                    type="primary"
                                                    disabled={
                                                      user?.email ? false : true
                                                    }
                                                    onClick={() =>
                                                      sendAnswerToUser(result)
                                                    }
                                                    loading={answerLoading}
                                                  >
                                                    Send answer
                                                  </Button>
                                                </Tooltip>
                                              </div>
                                            </div>
                                          }
                                        >
                                          <Row
                                            justify="space-between"
                                            align="top"
                                          >
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
                                                  <BranchesOutlined /> Branch:{" "}
                                                  <span
                                                    style={{
                                                      fontWeight: "bold",
                                                    }}
                                                  >
                                                    {result.branchName}
                                                  </span>
                                                </Text>
                                                <Text>
                                                  <ClockCircleOutlined />{" "}
                                                  Duration:{" "}
                                                  <span
                                                    style={{
                                                      color: token.colorPrimary,
                                                    }}
                                                  >
                                                    {calculateDuration(
                                                      result.startDate,
                                                      result.endDate
                                                    )}
                                                  </span>
                                                </Text>
                                                <Text
                                                  style={{ fontWeight: "bold" }}
                                                >
                                                  <ClockCircleOutlined /> Test
                                                  Time:{" "}
                                                  <span
                                                    style={{
                                                      color: token.colorPrimary,
                                                    }}
                                                  >
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
                                                  userId={id}
                                                  setRefresh={
                                                    setQuestionRefresh
                                                  }
                                                />
                                                <ScoreBox
                                                  id={result.id}
                                                  icon={<ReadOutlined />}
                                                  label="Reading"
                                                  score={result.reading}
                                                  userId={id}
                                                  setRefresh={
                                                    setQuestionRefresh
                                                  }
                                                />
                                                <ScoreBox
                                                  id={result.id}
                                                  icon={<EditOutlined />}
                                                  label="Writing"
                                                  score={result.writing}
                                                  userId={id}
                                                  setRefresh={
                                                    setQuestionRefresh
                                                  }
                                                />
                                                <ScoreBox
                                                  id={result.id}
                                                  icon={<AudioOutlined />}
                                                  label="Speaking"
                                                  score={result.speaking}
                                                  userId={id}
                                                  setRefresh={
                                                    setQuestionRefresh
                                                  }
                                                />
                                              </Space>
                                            </Col>
                                          </Row>
                                        </Card>
                                      ) : (
                                        <Card>
                                          <Row
                                            justify="space-between"
                                            align="top"
                                          >
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
                                                  <BranchesOutlined /> Branch:{" "}
                                                  <span
                                                    style={{
                                                      fontWeight: "bold",
                                                    }}
                                                  >
                                                    {result.branchName}
                                                  </span>
                                                </Text>
                                                <Text
                                                  style={{ fontWeight: "bold" }}
                                                >
                                                  <ClockCircleOutlined /> Test
                                                  Date:{" "}
                                                  <span
                                                    style={{
                                                      color: !isBeforeDate
                                                        ? token.colorError
                                                        : token.colorPrimary,
                                                    }}
                                                  >
                                                    {formatDate(
                                                      result.testDate
                                                    )}
                                                  </span>
                                                </Text>
                                                <Text
                                                  style={{ fontWeight: "bold" }}
                                                >
                                                  <ClockCircleOutlined /> Test
                                                  Time:{" "}
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
                                                <Link
                                                  to={`/dashboard/contest/${result.id}/TEST`}
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
                                                  userId={id}
                                                  setRefresh={
                                                    setQuestionRefresh
                                                  }
                                                  booking
                                                  isBeforeDate={isBeforeDate}
                                                />
                                                <ScoreBox
                                                  id={result.id}
                                                  icon={<ReadOutlined />}
                                                  label="Reading"
                                                  score={result.reading}
                                                  userId={id}
                                                  setRefresh={
                                                    setQuestionRefresh
                                                  }
                                                  booking
                                                  isBeforeDate={isBeforeDate}
                                                />
                                                <ScoreBox
                                                  id={result.id}
                                                  icon={<EditOutlined />}
                                                  label="Writing"
                                                  score={result.writing}
                                                  userId={id}
                                                  setRefresh={
                                                    setQuestionRefresh
                                                  }
                                                  booking
                                                  isBeforeDate={isBeforeDate}
                                                />
                                                <ScoreBox
                                                  id={result.id}
                                                  icon={<AudioOutlined />}
                                                  label="Speaking"
                                                  score={result.speaking}
                                                  userId={id}
                                                  setRefresh={
                                                    setQuestionRefresh
                                                  }
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
                        );
                      }}
                    />
                  )}
                </Card>
              </List.Item>
            );
          }}
        />
      )}
    </div>
  );
};

export default UserDetails;
