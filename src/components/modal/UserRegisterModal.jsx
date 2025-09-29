import { Button, Form, Input, Modal, Radio } from "antd";
import React from "react";
import apiClient from "../../services/api";
import { MaskedInput } from "antd-mask-input";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const UserRegisterModal = ({ isModalOpen, setIsModalOpen }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const checkUsernameAvailability = async (username) => {
    if (!username) return;
    try {
      const response = await apiClient.post(
        `/api/v1/admin/user/check-username`,
        {
          username: username,
        }
      );
      if (response.code === 400) {
        form.setFields([
          {
            name: "username",
            errors: ["Username is already taken"],
          },
        ]);
      } else {
        form.setFields([
          {
            name: "username",
            errors: [],
          },
        ]);
      }
    } catch (error) {
      toast.error("Failed to check username availability");
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleCreateUser = (values) => {    
    apiClient
      .post("/api/v1/admin/user/save", values)
      .then((response) => {
        if (response.code === 200) {
          toast.success("User created successfully");
          form.resetFields();
          setIsModalOpen(false);
          // setRefreshKey((prevKey) => prevKey + 1);
          navigate(`/dashboard/user/${response.data.id}/booking`);
        } else {
          toast.error("Failed to create user");
        }
      })
      .catch((error) => {
        console.log("Error creating user:", error);
        toast.error("An error occurred while creating the user");
      });
  };

  return (
    <Modal
      title="Create New Candidates"
      open={isModalOpen}
      onCancel={handleModalClose}
      footer={null}
    >
      <Form form={form} onFinish={handleCreateUser} layout="vertical">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          <Form.Item
            name="firstname"
            label="First Name"
            style={{ flex: 1 }}
            rules={[{ required: true, message: "Please enter the first name" }]}
          >
            <Input placeholder="Enter first name" />
          </Form.Item>
          <Form.Item
            name="lastname"
            style={{ flex: 1 }}
            label="Last Name"
            rules={[{ required: true, message: "Please enter the last name" }]}
          >
            <Input placeholder="Enter last name" />
          </Form.Item>
        </div>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { type: "email", message: "Please enter a valid email address" },
          ]}
        >
          <Input placeholder="Enter user email" />
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
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          <Form.Item
            name="username"
            label="Username"
            style={{ flex: 1 }}
            rules={[{ required: true, message: "Please enter the username" }]}
          >
            <Input
              placeholder="Enter username"
              onBlur={(e) => checkUsernameAvailability(e.target.value)}
            />
          </Form.Item>
        </div>
        <Form.Item
          name="password"
          label="Password"
          rules={[
            { required: true, message: "Please enter a password" },
            {
              min: 6,
              message: "Password must be at least 6 characters long",
            },
          ]}
        >
          <Input.Password placeholder="Enter password" />
        </Form.Item>
        <Form.Item
          name={"everester"}
          label="Everester?"
          rules={[{ required: true, message: "Please select" }]}
        >
          <Radio.Group>
            <Radio value={true}>Yes</Radio>
            <Radio value={false}>No</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button type="primary" htmlType="submit">
            Create
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UserRegisterModal;
