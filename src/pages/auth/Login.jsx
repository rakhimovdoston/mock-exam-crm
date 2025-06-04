import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Form, Input, Button, message, Image, Col } from "antd";
import logo from "../../assets/logo.jpeg"
import { toast } from "react-toastify";
import apiClient from "../../services/api";
import { useDispatch } from "react-redux";
import { login } from "../../store/authReducer";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onFinish = async(values) => {
    setLoading(true);
    try {

      const response = await apiClient.post("api/v1/auth/authenticate", values);

      if (response.code !== 200) {
        console.error("Login failed:", response);
        toast.error("Username or password is incorrect.");
        return;
      }

      const { access_token, refresh_token } = response.data;
      
      dispatch(login({ accessToken: access_token, refreshToken: refresh_token }));
      navigate("/");
      toast.success("Login successful!");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Usernae or password is incorrect.");
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh", // Full viewport height
        backgroundColor: "#f5f5f5", // Optional background color
      }}
    >
      <Form
        name="login"
        initialValues={{ remember: false }}
        style={{
          maxWidth: 360,
          width: "100%",
          padding: "24px",
          backgroundColor: "#fff",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", // Optional shadow for better appearance
        }}
        onFinish={onFinish}
      >
        <Col
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <Image
            src={logo} // Replace with your logo path
            alt="Consulting Logo"
            width={100}
            preview={false}
          />
          <h2 style={{ marginLeft: "10px" }}>Mock Exam System</h2>
        </Col>
        <Form.Item
          name="username"
          rules={[
            { required: true, message: "Please input your Username!" },
          ]}
        >
          <Input prefix={<UserOutlined />} type="text" placeholder="Username" />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: "Please input your Password!" }]}
        >
          <Input
            prefix={<LockOutlined />}
            type="password"
            placeholder="Password"
          />
        </Form.Item>

        <Form.Item>
          <Button block type="primary" htmlType="submit" loading={loading}>
            Log in
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Login;
