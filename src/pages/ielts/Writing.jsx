import React, { useState } from "react";
import { Select, Button, Spin, Result, Table, Tag, Modal } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import emptyCart from "../../assets/not_found.svg";
import useApiRequest from "../../hooks/useApiRequest"; // Adjust the import path as necessary
import { toast } from "react-toastify";
import apiClient from "../../services/api";

const { Option } = Select;

const Writing = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [type, setType] = useState(searchParams.get("type") || "all");
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1
  );
  const [pageSize, setPageSize] = useState(
    Number(searchParams.get("pageSize")) || 10
  );
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedListening, setSelectedListening] = useState(null);
  const [isRefresh, setRefresh] = useState(false);

  const { loading, data } = useApiRequest(
    `/api/v1/writing/all?type=${type}&page=${currentPage - 1}&size=${pageSize}`,
    [type, currentPage, isRefresh]
  );

  const handleTypeChange = (value) => {
    setType(value);
    setCurrentPage(1);
    setSearchParams({ type: value, page: 1, pageSize });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSearchParams({ type, page, pageSize });
  };

  const handleDelete = async () => {
    try {
      const response = await apiClient.delete(
        `/api/v1/writing/delete/${selectedListening.id}`
      );
      if (response.code === 200) {
        toast.success("Reading deleted successfully!");
        setDeleteModalVisible(false);
        setRefresh(!isRefresh);
      } else {
        toast.error(response.message || "Failed to delete the Writing.");
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete the Writing.");
    }
  };

  const columns = [
    {
      title: "№",
      dataIndex: "index",
      key: "index",
      render: (text, record, index) =>
        index + 1 + (currentPage - 1) * pageSize,
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (title) => (
        <b>{title.length > 100 ? `${title.substring(0, 100)}...` : title}</b>
      ),
    },
    {
      title: "Task",
      dataIndex: "task",
      key: "task",
      render: (task) => <p>{task ? "Part 1" : "Part 2"}</p>,
    },
    {
      title: "Status",
      dataIndex: "active",
      key: "active",
      render: (active) =>
        active ? (
          <Tag color="green">Active</Tag>
        ) : (
          <Tag color="red">Inactive</Tag>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div
          style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}
        >
          <Button type="dashed" onClick={() => navigate(`${record.id}`)}>
            View
          </Button>
          <Button type="dashed" danger onClick={() => {
            setSelectedListening(record)
            setDeleteModalVisible(true)
          }}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Select
            value={type}
            style={{ width: 200 }}
            onChange={handleTypeChange}
          >
            <Option value="all">All</Option>
            <Option value="true">Part 1</Option>
            <Option value="false">Part 2</Option>
          </Select>
          <Button type="primary" onClick={() => navigate("create")}>
            Add New Writing
          </Button>
        </div>
      </div>

      <div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "24px" }}>
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={data?.data?.data.map((item) => ({
              ...item,
              key: item.id,
            }))}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: data?.data?.totalSizes,
              onChange: handlePageChange,
            }}
          />
        )}
      </div>
      <Modal
        title="Confirm Deletion"
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        footer={() => (
          <>
            <Button onClick={() => {
              setDeleteModalVisible(false)
            }}>Cancel</Button>
            <Button danger onClick={handleDelete}>
              Confirm
            </Button>
          </>
        )}
      >
        <p>
          Are you sure you want to delete the writing
          <b>"{selectedListening?.title}"</b>?
        </p>
      </Modal>
    </div>
  );
};

export default Writing;
