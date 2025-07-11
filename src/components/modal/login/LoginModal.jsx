import React, { useState } from "react";
import { Modal, Form, Input, Button, ConfigProvider } from "antd";
import "./loginModal.css"; // Import the CSS file
import RegisterModal from "./RegisterModal";
import { login } from "../../../store/authReducer";
import { useDispatch } from "react-redux";

const LoginModal = ({ open, setOpen, setRefresh }) => {
  const [form] = Form.useForm();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await apiClient.post("api/v1/auth/authenticate", values);

      if (response.code !== 200) {
        console.error("Login failed:", response);
        toast.error("Email or password is incorrect.");
        return;
      }

      const { access_token, refresh_token } = response.data;

      dispatch(
        login({ accessToken: access_token, refreshToken: refresh_token })
      );
      setRefresh((prev) => prev + 1);
      setOpen(false);
      form.resetFields();
      toast.success("Login successful!");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Email or password is incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<p style={{ textAlign: "center", fontSize: "20px" }}>Login</p>}
      open={open}
      centered
      style={{
        maxWidth: 360,
        backgroundColor: "#f9f9f9",
        borderRadius: 8,
      }}
      onCancel={() => {
        form.resetFields();
        setOpen(false);
      }}
      footer={null}
    >
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#4CAF50",
            colorBgBase: "#F0F4F8",
            colorTextBase: "#333333",
            colorBorderBase: "#B0BEC5",
          },
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          name="loginForm"
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please input your email!" },
              { type: "email", message: "Please enter a valid email!" },
            ]}
          >
            <Input placeholder="example@gmail.com" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password placeholder="123456" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={loading}
              block
            >
              Login
            </Button>
          </Form.Item>
        </Form>
      </ConfigProvider>
      <div style={{ width: "100%", textAlign: "center", marginTop: 16 }}>
        <button
          className="register-button"
          onClick={() => {
            setRegisterOpen(true);
          }}
        >
          Register a new user
        </button>
      </div>
      <RegisterModal open={registerOpen} setOpen={setRegisterOpen} />
    </Modal>
  );
};

export default LoginModal;
