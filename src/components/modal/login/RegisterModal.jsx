import React from "react";
import { Modal, Form, Input, Button, ConfigProvider } from "antd";
import "./loginModal.css";

const RegisterModal = ({ open, setOpen }) => {
  const [form] = Form.useForm();

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        form.resetFields();
      })
      .catch((info) => {
        console.log("Validation Failed:", info);
      });
  };

  return (
    <Modal
      title={<p style={{ textAlign: "center" }}>Register as a new user</p>}
      open={open}
      centered
      style={{
        maxWidth: 450,
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
        <Form form={form} layout="vertical" name="registerForm">
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
            name="firstname"
            label="Firstname"
            rules={[
              { required: true, message: "Please input your firstname!" },
            ]}
          >
            <Input placeholder="John" />
          </Form.Item>
          <Form.Item
            name="Lastname"
            label="Lastname"
            rules={[{ required: true, message: "Please input your lastname!" }]}
          >
            <Input placeholder="Doe" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password placeholder="123456" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleSubmit} block>
              Register
            </Button>
          </Form.Item>
          <Form.Item>
            <button
              className="register-button"
              onClick={() => {
                form.resetFields();
                setOpen(false);
              }}
              block
            >
              Already have an account? Login
            </button>
          </Form.Item>
        </Form>
      </ConfigProvider>
    </Modal>
  );
};

export default RegisterModal;
