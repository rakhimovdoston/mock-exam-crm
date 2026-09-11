import { Button, Form, Input, Modal, Radio } from "antd";
import React from "react";
import apiClient from "../../services/api";
import { MaskedInput } from "antd-mask-input";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useT } from "../../i18n/useT";

const UserRegisterModal = ({ isModalOpen, setIsModalOpen }) => {
  const t = useT();
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
            errors: [t("candidates.usernameTaken")],
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
    } catch {
      toast.error("Failed to check username availability");
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleCreateUser = (values) => {    
    const phone = values.phone.replace(/[^0-9+]/g, "");
    const payload = { ...values, phone };
    apiClient
      .post("/api/v1/admin/user/save", payload)
      .then((response) => {
        if (response.code === 200) {
          toast.success(t("candidates.createdOk"));
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
      title={t("candidates.createTitle")}
      open={isModalOpen}
      onCancel={handleModalClose}
      footer={null}
    >
      <Form form={form} onFinish={handleCreateUser} layout="vertical">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          <Form.Item
            name="firstname"
            label={t("candidates.firstName")}
            style={{ flex: 1 }}
            rules={[{ required: true, message: "Please enter the first name" }]}
          >
            <Input placeholder={t("candidates.firstName")} />
          </Form.Item>
          <Form.Item
            name="lastname"
            style={{ flex: 1 }}
            label={t("candidates.lastName")}
            rules={[{ required: true, message: "Please enter the last name" }]}
          >
            <Input placeholder={t("candidates.lastName")} />
          </Form.Item>
        </div>
        <Form.Item
          name="email"
          label={t("candidates.email")}
          rules={[
            { type: "email", message: "Please enter a valid email address" },
          ]}
        >
          <Input placeholder={t("candidates.email")} />
        </Form.Item>
        <Form.Item
          name="phone"
          label={t("candidates.phone")}
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
            label={t("candidates.username")}
            style={{ flex: 1 }}
            rules={[{ required: true, message: "Please enter the username" }]}
          >
            <Input
              placeholder={t("candidates.username")}
              onBlur={(e) => checkUsernameAvailability(e.target.value)}
            />
          </Form.Item>
        </div>
        <Form.Item
          name="password"
          label={t("candidates.password")}
          rules={[
            { required: true, message: "Please enter a password" },
            {
              min: 6,
              message: "Password must be at least 6 characters long",
            },
          ]}
        >
          <Input.Password placeholder={t("candidates.password")} />
        </Form.Item>
        <Form.Item
          name={"everester"}
          label={`${t("candidates.everester")}?`}
          rules={[{ required: true, message: "Please select" }]}
        >
          <Radio.Group>
            <Radio value={true}>{t("common.yes")}</Radio>
            <Radio value={false}>{t("common.no")}</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button type="primary" htmlType="submit">
            {t("common.add")}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UserRegisterModal;
