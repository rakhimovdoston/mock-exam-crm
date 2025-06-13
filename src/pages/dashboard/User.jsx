import React, { useEffect, useState } from "react";
import { Table, Button, Input, Modal, Form, message, Tag } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import useApiRequest from "../../hooks/useApiRequest";
import apiClient from "../../services/api";
import { toast } from "react-toastify";

const User = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pagination, setPagination] = useState({
    current: parseInt(searchParams.get("page")) || 1,
    pageSize: parseInt(searchParams.get("size")) || 10,
  });
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading } = useApiRequest(
    `api/v1/admin/user/all?page=${pagination.current - 1}&size=${pagination.pageSize}&search=${searchTerm}`,
    [pagination.current, pagination.pageSize, searchTerm, refreshKey]
  );

  const navigate = useNavigate();

  const handleTableChange = (page, pageSize) => {
    setPagination({ current: page, pageSize });
    setSearchParams({
      page,
      size: pageSize,
      search: searchTerm,
    });
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSearchParams({
      page: pagination.current,
      size: pagination.pageSize,
      search: value,
    });
  };

  const handleModalOpen = () => {
    setIsModalOpen(true);
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
          setRefreshKey((prevKey) => prevKey + 1); // Trigger a refresh of the data
        } else {
          toast.error("Failed to create user");
        }
      })
      .catch((error) => {
        console.log("Error creating user:", error);
        toast.error("An error occurred while creating the user");
      });
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
      message.error("Failed to check username availability");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "First Name",
      dataIndex: "firstname",
      key: "firstname",
      sorter: (a, b) => a.firstname.localeCompare(b.firstname),
    },
    {
      title: "Last Name",
      dataIndex: "lastname",
      key: "lastname",
      sorter: (a, b) => a.lastname.localeCompare(b.lastname),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email) => email ? email: "-"
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      sorter: (a, b) => a.username.localeCompare(b.username),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) =><Tag color="blue" key={status}>{status}</Tag>,
    },
    {
      title: "",
      key: "actions",
      render: (_, record) => (
        <Button onClick={() => navigate(`/dashboard/user/${record.id}`)}>View</Button>
      )
    }
  ];

  useEffect(() => {
    const page = parseInt(searchParams.get("page")) || 1;
    const size = parseInt(searchParams.get("size")) || 10;
    const search = searchParams.get("search") || "";

    setPagination({ current: page, pageSize: size });
    setSearchTerm(search);
  }, [searchParams]);

  return (
    <div>
      <h1>Users</h1>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          gap: 8,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* <label style={{ display: "block", marginBottom: 4 }}>Search:</label>
          <Input
            placeholder="Search by name or username"
            value={searchTerm}
            onChange={handleSearch}
            style={{ width: 200, marginRight: 8 }}
          /> */}
        </div>
        <Button type="primary" onClick={handleModalOpen}>
          Create New User
        </Button>
      </div>
      <Table
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
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
        title="Create New User"
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
              { type: "email", message: "Please enter a valid email address" },
            ]}
          >
            <Input placeholder="Enter user email" />
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
            {/* <Form.Item
              name="phone"
              style={{ flex: 1 }}
              label="Phone Number"
              rules={[
                {
                  pattern: /^[0-9]{10,15}$/,
                  message: "Phone number must be between 10 and 15 digits",
                },
              ]}
            >
              <Input placeholder="Enter phone number" />
            </Form.Item> */}
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
          <Form.Item style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button type="primary" htmlType="submit">
              Create
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default User;
