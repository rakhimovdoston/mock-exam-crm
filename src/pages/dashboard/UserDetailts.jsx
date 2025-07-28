import React, { useState } from "react";
import { useParams } from "react-router-dom";
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
  const [answerLoading, setAnswerLoading] = useState(false);

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
      toast.error(err.message || "There was an error sending the answer");
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
          response.message || "There was an some problem refresh the answer"
        );
        return;
      }
      setQuestionRefresh((prev) => prev + 1);
    } catch (err) {
      toast.error(err.message || "There was an error refresh the answer");
    } finally {
      setAnswerLoading(false);
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
          renderItem={(item) => (
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
                    <Text>
                      Total Session: {item.mockPackages.totalSessions}
                    </Text>
                    <Text>
                      Speaking Session: {item.mockPackages.speakingSessions}
                    </Text>
                  </div>
                }
                variant={"borderless"}
                style={{
                  borderRadius: "10px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <List
                  grid={{ gutter: 24, column: 1 }}
                  dataSource={item.results}
                  renderItem={(result) => {
                    const isBeforeDate = new Date(result.testDate) > new Date();
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
                                  {formatDate(result.startDate)}
                                </Text>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                  }}
                                >
                                  {result.status &&
                                    (result.status === "success" ? (
                                      <CheckCircleOutlined
                                        style={{
                                          color: token.colorPrimary,
                                          fontSize: 20,
                                        }}
                                      />
                                    ) : (
                                      <CloseCircleOutlined
                                        style={{
                                          color: token.colorError,
                                          fontSize: 20,
                                        }}
                                      />
                                    ))}
                                  <Tooltip title="Recalculate the student's answer">
                                    <Button
                                      icon={<ReloadOutlined />}
                                      loading={answerLoading}
                                      onClick={() => refreshExamAnswer(result)}
                                    />
                                  </Tooltip>
                                  <Tooltip title="Send to user his answer">
                                    <Button
                                      type="primary"
                                      disabled={user?.email ? false : true}
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
                                    <ClockCircleOutlined /> Duration:{" "}
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
                                  <Text style={{ fontWeight: "bold" }}>
                                    <ClockCircleOutlined /> Test Time:{" "}
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
                                </Space>
                              </Col>
                              <Col>
                                <Space>
                                  <ScoreBox
                                    id={result.id}
                                    icon={<ReadOutlined />}
                                    label="Reading"
                                    score={result.reading}
                                    userId={id}
                                    setRefresh={setQuestionRefresh}
                                  />
                                  <ScoreBox
                                    id={result.id}
                                    icon={<SoundOutlined />}
                                    label="Listening"
                                    score={result.listening}
                                    userId={id}
                                    setRefresh={setQuestionRefresh}
                                  />
                                  <ScoreBox
                                    id={result.id}
                                    icon={<EditOutlined />}
                                    label="Writing"
                                    score={result.writing}
                                    userId={id}
                                    setRefresh={setQuestionRefresh}
                                  />
                                  <ScoreBox
                                    id={result.id}
                                    icon={<AudioOutlined />}
                                    label="Speaking"
                                    score={result.speaking}
                                    userId={id}
                                    setRefresh={setQuestionRefresh}
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
                                  <Text style={{ fontWeight: "bold" }}>
                                    <ClockCircleOutlined /> Test Date:{" "}
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
                                    <ClockCircleOutlined /> Test Time:{" "}
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
                                </Space>
                              </Col>
                              <Col>
                                <Space>
                                  <ScoreBox
                                    id={result.id}
                                    icon={<ReadOutlined />}
                                    label="Reading"
                                    score={result.reading}
                                    userId={id}
                                    setRefresh={setQuestionRefresh}
                                    booking
                                    isBeforeDate={isBeforeDate}
                                  />
                                  <ScoreBox
                                    id={result.id}
                                    icon={<SoundOutlined />}
                                    label="Listening"
                                    score={result.listening}
                                    userId={id}
                                    setRefresh={setQuestionRefresh}
                                    booking
                                    isBeforeDate={isBeforeDate}
                                  />
                                  <ScoreBox
                                    id={result.id}
                                    icon={<EditOutlined />}
                                    label="Writing"
                                    score={result.writing}
                                    userId={id}
                                    setRefresh={setQuestionRefresh}
                                    booking
                                    isBeforeDate={isBeforeDate}
                                  />
                                  <ScoreBox
                                    id={result.id}
                                    icon={<AudioOutlined />}
                                    label="Speaking"
                                    score={result.speaking}
                                    userId={id}
                                    setRefresh={setQuestionRefresh}
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
    </div>
  );
};

export default UserDetails;
