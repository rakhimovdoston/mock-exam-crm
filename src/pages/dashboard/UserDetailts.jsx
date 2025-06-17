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
} from "antd";
import {
  ReadOutlined,
  EyeOutlined,
  SoundOutlined,
  EditOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

import useApiRequest from "../../hooks/useApiRequest";
import { toast } from "react-toastify";
import apiClient from "../../services/api";

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

const ScoreBox = ({ id, icon, label, score }) => {
  return (
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
        <Text>{score ?? "N/A"}</Text>
        <Link to={`/dashboard/history/${id}/${label.toLowerCase()}`}>
          <Button type="dashed" icon={<EyeOutlined />} />
        </Link>
      </Space>
    </Card>
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

  const { data, loading } = useApiRequest(`api/v1/admin/user/by/${id}`);
  const { data: historyData, loading: historyLoading } = useApiRequest(
    `api/v1/history/all/${id}`
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
      password: "",
    });
  };

  const handleSave = async (values) => {
    // Replace with actual API call to update user details
    console.log("Updated values:", values);
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
                  label="Username"
                  style={{ flex: 1 }}
                  name="username"
                  rules={[{ required: true, message: "Login is required" }]}
                >
                  <Input />
                </Form.Item>
              </div>
              <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: "Password is required" }]}
              >
                <Input.Password />
              </Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
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
                      />
                      <ScoreBox
                        id={item.id}
                        icon={<SoundOutlined />}
                        label="Listening"
                        score={item.listening}
                      />
                      <ScoreBox
                        id={item.id}
                        icon={<EditOutlined />}
                        label="Writing"
                        score={item.writing}
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
