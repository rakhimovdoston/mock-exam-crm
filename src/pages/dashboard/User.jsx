import React, { useState } from "react";
import { Table, Button, Input, Tag } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import useApiRequest from "../../hooks/useApiRequest";
import UserRegisterModal from "../../components/modal/UserRegisterModal";

const User = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pagination, setPagination] = useState({
    current: parseInt(searchParams.get("page")) || 1,
    pageSize: parseInt(searchParams.get("size")) || 10,
  });

  // Draft states - faqat input qiymatlari uchun
  const [firstname, setFirstname] = useState(searchParams.get("firstname") || "");
  const [lastname, setLastname] = useState(searchParams.get("lastname") || "");
  const [searchTerm, setSearchTerm] = useState(searchParams.get("username") || "");

  // Applied states - API so'roviga yuboriladi, faqat Search bosilganda yangilanadi
  const [appliedFilters, setAppliedFilters] = useState({
    firstname: searchParams.get("firstname") || "",
    lastname: searchParams.get("lastname") || "",
    username: searchParams.get("username") || "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, loading } = useApiRequest(
    `api/v1/admin/user/all?page=${pagination.current - 1}&size=${pagination.pageSize}&username=${appliedFilters.username}&firstname=${appliedFilters.firstname}&lastname=${appliedFilters.lastname}`,
    [pagination.current, pagination.pageSize, appliedFilters.username, appliedFilters.firstname, appliedFilters.lastname]
  );

  const navigate = useNavigate();

  const handleSearch = () => {
    const newFilters = { firstname, lastname, username: searchTerm };
    setAppliedFilters(newFilters);
    setPagination((prev) => ({ ...prev, current: 1 }));
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page", "1");
      if (firstname) params.set("firstname", firstname); else params.delete("firstname");
      if (lastname) params.set("lastname", lastname); else params.delete("lastname");
      if (searchTerm) params.set("username", searchTerm); else params.delete("username");
      return params;
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleTableChange = (page, pageSize) => {
    setPagination({ current: page, pageSize });
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page", String(page));
      params.set("size", String(pageSize));
      return params;
    });
  };

  const columns = [
    {
      title: "№",
      dataIndex: "index",
      key: "index",
      render: (_, __, index) =>
        index + 1 + (pagination.current - 1) * pagination.pageSize,
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
      render: (email) => (email ? email : "-"),
    },
    {
      title: "Phone Number",
      dataIndex: "phone",
      key: "phone",
      render: (phone) => (phone ? phone : "-"),
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      sorter: (a, b) => a.username.localeCompare(b.username),
    },
    {
      title: "Registration Source",
      dataIndex: "registrationSource",
      key: "registrationSource",
      render: (source) => {
        const isAdmin = source === "ADMIN_PANEL";
        return (
          <Tag color={isAdmin ? "gold" : "green"}>
            {isAdmin ? "Admin Created" : "Self Registered"}
          </Tag>
        );
      },
    },
    {
      title: "Everester",
      dataIndex: "everester",
      key: "everester",
      render: (everester) => (
        <Tag color={everester ? "green" : "red"}>
          {everester ? "Yes" : "No"}
        </Tag>
      ),
    },
    {
      title: "",
      width: 150,
      key: "actions",
      render: (_, record) => (
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <Button
            type="primary"
            onClick={() => navigate(`/dashboard/user/${record.id}/booking`)}
          >
            Book Test
          </Button>
          <Button onClick={() => navigate(`/dashboard/user/${record.id}`)}>
            View
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1>Candidates</h1>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          gap: 8,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <Input
            value={firstname}
            placeholder="Firstname"
            style={{ width: "200px" }}
            onChange={(e) => setFirstname(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Input
            value={lastname}
            placeholder="Lastname"
            style={{ width: "200px" }}
            onChange={(e) => setLastname(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Input
            value={searchTerm}
            placeholder="Username"
            style={{ width: "200px" }}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button type='primary' onClick={handleSearch}>Search</Button>
        </div>
        <Button type="primary" onClick={() => setIsModalOpen(true)}>
          New Candidates
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

      <UserRegisterModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
      />
    </div>
  );
};

export default User;
