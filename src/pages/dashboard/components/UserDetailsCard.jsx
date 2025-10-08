import React, { useState } from "react";
import { Card, Space, Typography, Form, Input, Button } from "antd";
import { MaskedInput } from "antd-mask-input";
import { toast } from "react-toastify";

import apiClient from "../../../services/api";

const { Title, Text } = Typography;

const formLayout = {
  layout: "vertical",
  style: { width: "100%" },
};

const rowStyle = { display: "flex", width: "100%", gap: "10px" };

const UserDetailsCard = ({ user, userId, onUserUpdated }) => {
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

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

  const handleCancel = () => {
    setIsEditing(false);
    form.resetFields();
  };

  const handleSave = async (values) => {
    setUpdateLoading(true);
    try {
      const response = await apiClient.put(
        `api/v1/admin/user/update/${userId}`,
        values
      );

      if (response.code !== 200) {
        toast.error(response.message || "Failed to update user details");
        return;
      }

      toast.success("Successfully updated user details!");
      onUserUpdated?.();
      setIsEditing(false);
    } catch (error) {
      toast.error(error.message || "Failed to update user details");
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <Card
      variant="borderless"
      style={{ maxWidth: 600, borderRadius: "12px" }}
    >
      <Space direction="vertical" style={{ width: "100%" }} align="start">
        {isEditing ? (
          <Form
            {...formLayout}
            form={form}
            onFinish={handleSave}
          >
            <Title level={4} style={{ marginBottom: 16 }}>
              Update User Details
            </Title>
            <div style={rowStyle}>
              <Form.Item
                label="First Name"
                style={{ flex: 1 }}
                name="firstname"
                rules={[{ required: true, message: "First name is required" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="Last Name"
                style={{ flex: 1 }}
                name="lastname"
                rules={[{ required: true, message: "Last name is required" }]}
              >
                <Input />
              </Form.Item>
            </div>
            <div style={rowStyle}>
              <Form.Item label="Email" style={{ flex: 1 }} name="email">
                <Input />
              </Form.Item>
              <Form.Item
                name="phone"
                label="Phone"
                rules={[
                  { required: true, message: "Please enter phone number" },
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
            <div style={rowStyle}>
              <Form.Item
                label="Username"
                style={{ flex: 1 }}
                name="username"
                rules={[{ required: true, message: "Username is required" }]}
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
              <Button onClick={handleCancel} disabled={updateLoading}>
                Cancel
              </Button>
            </Space>
          </Form>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Typography.Text strong>Full name:</Typography.Text>
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
  );
};

export default UserDetailsCard;
