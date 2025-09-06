import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Divider,
  Space,
  message,
  Flex,
  Checkbox,
  Skeleton,
} from "antd";
import { MaskedInput } from "antd-mask-input";
import apiClient from "../services/api";
import { toast } from "react-toastify";
import useApiRequest from "../hooks/useApiRequest";
import { checkRole } from "../utils/roleUtils";
import { Role } from "../data/role";

const { Title } = Typography;

const Settings = () => {
  const { user } = useSelector((state) => state.auth);

  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [updatePassword, setUpdatePassword] = useState(false);
  const [configLoading, setSConfigLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const { data, loading } = useApiRequest("api/v1/admin/user/sconfig", [
    refresh,
  ]);

  const onProfileFinish = async (values) => {
    setLoadingProfile(true);
    try {
      const response = await apiClient.post("api/v1/user/update", values);
      if (response.code != 200) {
        toast.error(
          response.message || "Something wrong for update profile info"
        );
        return;
      }
      toast.success("Porfile info successfull changed!");
      profileForm.resetFields();
    } catch (err) {
      toast.error(
        "There something connection problem please contact developer"
      );
    } finally {
      setLoadingProfile(false);
    }
  };

  const onPasswordFinish = async (values) => {
    setLoadingPassword(true);
    try {
      const response = await apiClient.put(
        "api/v1/user/update/password",
        values
      );
      if (response.code != 200) {
        toast.error(
          response.message || "Something wrong for update profile info"
        );
        return;
      }
      toast.success("Porfile info successfull changed!");
      passwordForm.resetFields();
      setUpdatePassword(false);
    } catch (err) {
      toast.error(
        "There something connection problem please contact developer"
      );
    } finally {
      setLoadingPassword(false);
    }
  };

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
        profileForm.setFields([
          {
            name: "username",
            errors: ["Username is already taken"],
          },
        ]);
      } else {
        profileForm.setFields([
          {
            name: "username",
            errors: [],
            warnings: ["Username is available ✅"],
          },
        ]);
      }
    } catch (error) {
      toast.error("Failed to check username availability");
    }
  };

  const changeConfigService = async (type) => {
    setSConfigLoading(true);
    try {
      const response = await apiClient.get(
        `api/v1/admin/user/change-config/${type}`
      );

      if (response.code != 200) {
        toast.error(response.message || "");
        return;
      }
      setRefresh((prev) => prev + 1);
    } catch (err) {
      toast.error(
        "There something connection problem please contact developer"
      );
    } finally {
      setSConfigLoading(false);
    }
  };

  return (
    <div>
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          gap: 20,
        }}
      >
        {/* Profile Update */}
        <div style={{ flex: 1 }}>
          <Title level={3}>Profile Information</Title>
          <Form
            form={profileForm}
            layout="horizontal"
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 18 }}
            initialValues={{
              firstname: user?.firstname,
              lastname: user?.lastname,
              phone: user?.phone,
              email: user?.email,
              username: user?.username,
            }}
            onFinish={onProfileFinish}
          >
            <Form.Item
              label="First Name"
              name="firstname"
              rules={[
                { required: true, message: "Please enter your first name" },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Last Name"
              name="lastname"
              rules={[
                { required: true, message: "Please enter your last name" },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item label="Phone number" name="phone">
              <MaskedInput
                mask="+998 (00) 000-00-00"
                placeholder="+998 (__) ___-__-__"
              />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, type: "email", message: "Enter valid email" },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item label="Username" name="username">
              <Input
                onBlur={(e) => checkUsernameAvailability(e.target.value)}
              />
            </Form.Item>

            <Form.Item wrapperCol={{ offset: 6 }}>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loadingProfile}
                >
                  Save Changes
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>

        {/* Password Change */}
        <div
          style={{
            flex: 1,
          }}
        >
          <Title level={3}>Change Password</Title>
          {updatePassword ? (
            <Form
              form={passwordForm}
              layout="horizontal"
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 18 }}
              onFinish={onPasswordFinish}
            >
              <Form.Item
                label="Current Password"
                name="oldPassword"
                rules={[
                  { required: true, message: "Enter your current password" },
                ]}
              >
                <Input.Password />
              </Form.Item>

              <Form.Item
                label="New Password"
                name="newPassword"
                rules={[{ required: true, message: "Enter a new password" }]}
              >
                <Input.Password />
              </Form.Item>

              <Form.Item
                label="Confirm Password"
                name="confirmNewPassword"
                dependencies={["newPassword"]}
                rules={[
                  {
                    required: true,
                    message: "Please confirm your new password",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("newPassword") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("The two passwords do not match!")
                      );
                    },
                  }),
                ]}
              >
                <Input.Password />
              </Form.Item>

              <Form.Item wrapperCol={{ offset: 6 }}>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loadingPassword}
                  >
                    Update Password
                  </Button>
                  <Button
                    htmlType="button"
                    onClick={() => {
                      setUpdatePassword(false);
                      passwordForm.resetFields();
                    }}
                  >
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          ) : (
            <Button onClick={() => setUpdatePassword(true)}>
              Update password
            </Button>
          )}
        </div>
      </div>

      <Divider />
      {checkRole(user.roles, Role.ROLE_ADMIN) && (
        <Space direction="vertical" style={{ width: "800px" }}>
          <Card>
            <Skeleton loading={loading} active>
              <Flex justify="space-between" align="start">
                <Space direction="vertical">
                  <Typography.Title level={3}>
                    Auto-Send Answers
                  </Typography.Title>
                  <p>
                    Enable this option to automatically deliver students'
                    answers to them within 1-2 hours after their test or
                    speaking has ended. This ensures they can review their
                    submitted responses without manual intervention.
                  </p>
                </Space>
                <Checkbox
                  checked={data?.data.autoSending}
                  onChange={() => changeConfigService("AUTO_SENDING_ANSWERS")}
                />
              </Flex>
            </Skeleton>
          </Card>
          <Card>
            <Skeleton loading={loading} active>
              <Flex justify="space-between" align="start">
                <Space direction="vertical">
                  <Typography.Title level={3}>
                    SMS Results Service
                  </Typography.Title>
                  <p>
                    Enable this option to automatically send students their test
                    results via SMS.
                  </p>
                </Space>
                <Checkbox
                  checked={data?.data.sms}
                  onChange={() => changeConfigService("SMS_SERViCE")}
                />
              </Flex>
            </Skeleton>
          </Card>
          <Card>
            <Skeleton loading={loading} active>
              <Flex justify="space-between" align="start">
                <Space direction="vertical">
                  <Typography.Title level={3}>
                    Email Results Service
                  </Typography.Title>
                  <p>
                    Enable this option to automatically send students their test
                    results via email.
                  </p>
                </Space>
                <Checkbox
                  checked={data?.data.email}
                  onChange={() => changeConfigService("EMAIL_SERVICE")}
                />
              </Flex>
            </Skeleton>
          </Card>
        </Space>
      )}
    </div>
  );
};

export default Settings;
