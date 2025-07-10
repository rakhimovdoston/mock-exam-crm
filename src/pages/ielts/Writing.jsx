import React, { useState, useEffect } from "react";
import { Select, Button, Spin, Result, Table, Tag, Modal } from "antd";
import { useNavigate } from "react-router-dom";
import emptyCart from "../../assets/not_found.svg";
import useApiRequest from "../../hooks/useApiRequest"; // Adjust the import path as necessary
import { toast } from "react-toastify";
import apiClient from "../../services/api";

const { Option } = Select;

const Writing = () => {
  const navigate = useNavigate();
  const [type, setType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // Number of items per page
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedListening, setSelectedListening] = useState(null);
  const [isRefresh, setRefresh] = useState(false);

  // Update the API request URL dynamically based on type and currentPage
  const { loading, data } = useApiRequest(
    `/api/v1/writing/all?type=${type}&page=${currentPage - 1}&size=${pageSize}`,
    [type, currentPage, isRefresh]
  );

  useEffect(() => {
    // Update the URL query parameters when the page changes
    const queryParams = new URLSearchParams();
    queryParams.set("type", type);
    queryParams.set("page", currentPage);
    queryParams.set("pageSize", pageSize);
    window.history.replaceState(null, "", `?${queryParams.toString()}`);
  }, [type, currentPage, pageSize, isRefresh]);

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
      title: "ID",
      dataIndex: "id",
      key: "id"
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
            defaultValue={type}
            style={{ width: 200 }}
            onChange={(value) => setType(value)}
          >
            <Option value="all">All</Option>
            <Option value="true">Part 1</Option>
            <Option value="false">Part 2</Option>
          </Select>
          <Button type="primary" onClick={() => navigate("create")}>
            New
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
              onChange: (page) => setCurrentPage(page),
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
