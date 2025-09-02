import { Button, Input, Modal, Form, Table, Select, Checkbox, Tag } from "antd";
import React, { useState } from "react";
import useApiRequest from "../../hooks/useApiRequest";
import { MaskedInput } from "antd-mask-input";
import apiClient from "../../services/api";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

const { Option } = Select;

const EmployeePage = () => {
  const [page, setPage] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const [size, setSize] = useState(10);
  const [selectPostion, setSelectPosition] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [employeeLoading, setEmployeeLoading] = useState(false);

  const [form] = Form.useForm();

  const { data, loading } = useApiRequest(
    `api/v1/super-admin/all?page=${page}&size=${size}&role=${selectPostion}`,
    [refreshKey, page, size, selectPostion]
  );
  const branch = useApiRequest(`api/v1/branch/all?active=false`);

  const columns = [
    {
      title: "№",
      dataIndex: "index",
      key: "index",
      render: (text, record, index) => index + 1,
      //  + (pagination.current - 1) * pagination.pageSize,
    },
    {
      title: "Status",
      dataIndex: "active",
      key: "active",
      render: (active) => (
        <Tag color={active ? "green" : "red"}>
          {active ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Full Name",
      dataIndex: "fullname",
      key: "fullname",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
    },
    {
      title: "Positions",
      dataIndex: "roles",
      key: "roles",
      render: (roles) => (
        <>
          {roles.map((role, idx) => (
            <Tag
              color={
                role === "ROLE_BRANCH_ADMIN"
                  ? "blue"
                  : role === "ROLE_SPEAKER"
                  ? "green"
                  : "red"
              }
              key={idx}
            >
              {role === "ROLE_BRANCH_ADMIN"
                ? "ADMIN"
                : role === "ROLE_SPEAKER"
                ? "SPEAKER"
                : role}
            </Tag>
          ))}
        </>
      ),
    },
    // {
    //   title: "",
    //   width: 150,
    //   key: "actions",
    //   render: (_, record) => (
    //     <div
    //       style={{
    //         display: "flex",
    //         gap: "8px",
    //         alignItems: "center",
    //         justifyContent: "flex-end",
    //       }}
    //     >
    //       <Button onClick={() => navigate(`/dashboard/user/${record.id}`)}>
    //         View
    //       </Button>
    //     </div>
    //   ),
    // },
  ];

  const handleModalClose = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleTableChange = (page, pageSize) => {
    setPage(page - 1);
    setSize(pageSize);
    setSearchParams({
      page,
      size: pageSize,
      search: searchTerm,
    });
  };

  const handleCreateUser = async (values) => {
    setEmployeeLoading(true);
    apiClient
      .post("/api/v1/super-admin/new-employee", values)
      .then((response) => {
        if (response.code === 200) {
          toast.success("User created successfully");
          form.resetFields();
          setIsModalOpen(false);
          setRefreshKey((prevKey) => prevKey + 1);
        } else {
          toast.error("Failed to create user");
        }
      })
      .catch((error) => {
        console.log("Error creating user:", error);
        toast.error("An error occurred while creating the user");
      })
      .finally(() => setEmployeeLoading(false));
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

  return (
    <div>
      <h1>Team Members</h1>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          gap: 8,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}
        >
          <Input placeholder="Search" style={{ width: "200px" }} />
          <Select
            defaultValue={selectPostion}
            onChange={(value) => setSelectPosition(value)}
            style={{ width: 200 }}
          >
            <Option value="all">All Position</Option>
            <Option value="BRANCH_ADMIN">Admin</Option>
            <Option value="SPEAKER">Speaker</Option>
          </Select>
        </div>
        <Button type="primary" onClick={() => setIsModalOpen(true)}>
          New member
        </Button>
      </div>
      <Table
        loading={loading}
        pagination={{
          current: page + 1,
          pageSize: size,
          total: data?.data?.totalSizes || 0,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          showQuickJumper: true,
          onChange: handleTableChange,
        }}
        dataSource={data?.data?.data}
        columns={columns}
        rowKey="username"
      />

      <Modal
        title="New Members"
        open={isModalOpen}
        onCancel={handleModalClose}
        footer={null}
      >
        <Form form={form} onFinish={handleCreateUser} layout="vertical">
          <Form.Item
            name={"branchId"}
            label="Select Branch"
            rules={[{ required: true, message: "Please select a branch" }]}
          >
            <Select placeholder="Select branch">
              {branch.data?.data?.branches?.map((branch) => (
                <Option key={branch.id} value={branch.id}>
                  {branch.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            <Form.Item
              name="firstname"
              label="First Name"
              style={{ flex: 1 }}
              rules={[
                { required: true, message: "Please enter the first name" },
              ]}
            >
              <Input placeholder="Enter first name" />
            </Form.Item>
            <Form.Item
              name="lastname"
              style={{ flex: 1 }}
              label="Last Name"
              rules={[
                { required: true, message: "Please enter the last name" },
              ]}
            >
              <Input placeholder="Enter last name" />
            </Form.Item>
          </div>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              {
                type: "email",
                message: "Please enter a valid email address",
              },
            ]}
          >
            <Input placeholder="Enter user email" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Phone"
            rules={[
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
            name={"roles"}
            label="Select Positions"
            rules={[
              { required: true, message: "Please select at least one role" },
            ]}
          >
            <Checkbox.Group>
              <Checkbox value="ROLE_BRANCH_ADMIN">Branch Admin</Checkbox>
              <Checkbox value="ROLE_SPEAKER">Speaker</Checkbox>
            </Checkbox.Group>
          </Form.Item>
          <Form.Item style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={employeeLoading}
              disabled={employeeLoading}
            >
              Save member
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeePage;
