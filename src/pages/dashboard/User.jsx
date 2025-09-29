import React, { useEffect, useState } from "react";
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
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, loading } = useApiRequest(
    `api/v1/admin/user/all?page=${pagination.current - 1}&size=${
      pagination.pageSize
    }&search=${searchTerm}`,
    [pagination.current, pagination.pageSize, searchTerm]
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

  const handleModalOpen = () => {
    setIsModalOpen(true);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    const pageSize = pagination.pageSize;

    setSearchTerm(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);

      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }

      params.set("page", "1");
      if (!params.get("size")) {
        params.set("size", String(pageSize));
      }

      return params;
    });
  };

  const columns = [
    {
      title: "№",
      dataIndex: "index",
      key: "index",
      render: (text, record, index) =>
        index + 1 + (pagination.current - 1) * pagination.pageSize,
    },
    // {
    //   title: "ID",
    //   dataIndex: "id",
    //   key: "id",
    // },
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

  useEffect(() => {
    const page = parseInt(searchParams.get("page")) || 1;
    const size = parseInt(searchParams.get("size")) || 10;
    const search = searchParams.get("search") || "";

    setPagination({ current: page, pageSize: size });
    setSearchTerm(search);
  }, [searchParams]);

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
        <div
          style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}
        >
          <Input
            value={searchTerm}
            placeholder="Search"
            style={{ width: "200px" }}
            onChange={handleSearchChange}
          />
        </div>
        <Button type="primary" onClick={handleModalOpen}>
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
