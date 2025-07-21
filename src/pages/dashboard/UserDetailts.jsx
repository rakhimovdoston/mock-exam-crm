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
  Modal,
} from "antd";
import {
  ReadOutlined,
  EyeOutlined,
  SoundOutlined,
  EditOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  AudioOutlined,
} from "@ant-design/icons";

import useApiRequest from "../../hooks/useApiRequest";
import { toast } from "react-toastify";
import apiClient from "../../services/api";
import { MaskedInput } from "antd-mask-input";

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

const ScoreBox = ({ id, icon, label, score, setRefresh, userId }) => {
  const [isSpeakingModalVisible, setIsSpeakingModalVisible] = useState(false);
  const [selectedSpeakingScore, setSelectedSpeakingScore] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSpeakingModalOk = async () => {
    if (errorMessage) {
      toast.error("Score must be between 0.0 and 9.0");
      return;
    }
    setLoading(true);
    const requestBody = {
      examId: id,
      type: "speaking",
      score: selectedSpeakingScore,
    };
    try {
      const response = await apiClient.post(
        `api/v1/history/set-score/${userId}`,
        requestBody
      );
      if (response.code !== 200) {
        toast.error(response.message || "Set Score some error");
        return;
      }
      setIsSpeakingModalVisible(false);
      setRefresh((prev) => prev + 1);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handleSpeakingModalCancel = () => {
    setErrorMessage("");
    setSelectedSpeakingScore(null);
    setIsSpeakingModalVisible(false);
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

  return (
    <>
      <Card
        size="small"
        style={{
          minWidth: 120,
          textAlign: "center",
          backgroundColor: "#f0f5ff",
          border: "1px solid #1890ff",
          borderRadius: "8px",
        }}
      >
        <Space direction="vertical">
          {icon}
          <Text strong>{label}</Text>
          <Text>{score ?? "0.0"} ball</Text>
          {label === "Speaking" ? (
            <Button
              onClick={() => {
                setIsSpeakingModalVisible(true);
                setSelectedSpeakingScore(score);
              }}
            >
              Set score
            </Button>
          ) : (
            <Link
              to={
                label === "Writing"
                  ? `/dashboard/history/${userId}/${label.toLowerCase()}/${id}`
                  : `/dashboard/history/${id}/${label.toLowerCase()}`
              }
            >
              <Button type="dashed" icon={<EyeOutlined />} />
            </Link>
          )}
        </Space>
      </Card>
      <Modal
        title="Speaking Assessment"
        open={isSpeakingModalVisible}
        onOk={handleSpeakingModalOk}
        okButtonProps={{
          disabled: loading,
          loading: loading,
        }}
        onCancel={handleSpeakingModalCancel}
      >
        <p>Current Speaking Score: {selectedSpeakingScore ?? "0.0"} ball</p>
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
    </>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
};

const calculateDuration = (start, end) => {
  if (!start || !end) return "N/A";
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate - startDate;

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  return `${hours}h ${minutes}m ${seconds}s`;
};

const UserDetails = () => {
  const { id } = useParams();

  const [refresh, setRefresh] = useState(1);
  const [questionRefresh, setQuestionRefresh] = useState(1);
  const { data, loading } = useApiRequest(`api/v1/admin/user/by/${id}`, [
    id,
    refresh,
  ]);
  const { data: historyData, loading: historyLoading } = useApiRequest(
    `api/v1/history/all/${id}`,
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
      password: "",
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
              <Button type="primary" onClick={handleEdit}>
                Edit Details
              </Button>
            </>
          )}
        </Space>
      </Card>

      <Divider>Test History</Divider>

      {historyLoading ? (
        <Spin />
      ) : (
        <List
          grid={{ gutter: 24, column: 1 }}
          dataSource={history}
          renderItem={(item) => (
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
                      <CalendarOutlined /> Test Date:{" "}
                      {formatDate(item.startDate)}
                    </Text>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      {!user?.email && (
                        <p style={{ fontSize: "14px", color: "red" }}>
                          Please enter the user's email address to send answers.
                        </p>
                      )}
                      {item.status == "success" && (
                        <p style={{ fontSize: "14px", color: "green" }}>
                          Answer sent to User
                        </p>
                      )}
                      <Button
                        type="primary"
                        disabled={user?.email ? false : true}
                        onClick={() => sendAnswerToUser(item)}
                        loading={answerLoading}
                      >
                        Send answer
                      </Button>
                    </div>
                  </div>
                }
                variant={"borderless"}
                style={{
                  borderRadius: "10px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <Row justify="space-between" align="top">
                  <Col>
                    <Space>
                      <Text>
                        <ClockCircleOutlined /> Duration:{" "}
                        {calculateDuration(item.startDate, item.endDate)}
                      </Text>
                    </Space>
                  </Col>
                  <Col>
                    <Space>
                      <ScoreBox
                        id={item.id}
                        icon={<ReadOutlined />}
                        label="Reading"
                        score={item.reading}
                        userId={id}
                        setRefresh={setQuestionRefresh}
                      />
                      <ScoreBox
                        id={item.id}
                        icon={<SoundOutlined />}
                        label="Listening"
                        score={item.listening}
                        userId={id}
                        setRefresh={setQuestionRefresh}
                      />
                      <ScoreBox
                        id={item.id}
                        icon={<EditOutlined />}
                        label="Writing"
                        score={item.writing}
                        userId={id}
                        setRefresh={setQuestionRefresh}
                      />
                      <ScoreBox
                        id={item.id}
                        icon={<AudioOutlined />}
                        label="Speaking"
                        score={item.speaking}
                        userId={id}
                        setRefresh={setQuestionRefresh}
                      />
                    </Space>
                  </Col>
                </Row>
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default UserDetails;
