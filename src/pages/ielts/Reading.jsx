import React, { useState, useEffect } from "react";
import { Select, Button, Spin, Result, Table, Tag, Modal } from "antd";
import { useNavigate } from "react-router-dom";
import emptyCart from "../../assets/not_found.svg"; // Adjust the path as necessary
import useApiRequest from "../../hooks/useApiRequest";
import { toast } from "react-toastify";
import apiClient from "../../services/api";

const { Option } = Select;

const Reading = () => {
  const [type, setType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // Number of items per page
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedListening, setSelectedListening] = useState(null);
  const [isRefresh, setRefresh] = useState(false);
  const navigate = useNavigate();

  const { data, loading, error } = useApiRequest(
    `/api/v1/reading/all?type=${type}&page=${currentPage - 1}&size=${pageSize}`,
    [type, currentPage, isRefresh]
  );

  useEffect(() => {
    const queryParams = new URLSearchParams();
    queryParams.set("type", type);
    queryParams.set("page", currentPage);
    queryParams.set("pageSize", pageSize);
    window.history.replaceState(null, "", `?${queryParams.toString()}`);
  }, [type, currentPage, pageSize]);

  const getPassage = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return "Reading Passage 1";
      case "medium":
        return "Reading Passage 2";
      case "hard":
        return "Reading Passage 3";
      default:
        return "Unknown Passage";
    }
  };

  const handleDelete = async () => {
    try {
      const response = await apiClient.delete(
        `/api/v1/reading/delete/${selectedListening.id}`
      );
      if (response.code === 200) {
        toast.success("Reading deleted successfully!");
        setDeleteModalVisible(false);
        setRefresh(!isRefresh);
      } else {
        toast.error(response.message || "Failed to delete the reading.");
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete the reading.");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type) => <p>{getPassage(type)}</p>,
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
          <Button
            type="dashed"
            onClick={() => navigate(`${record.id}/questions`)}
          >
            View
          </Button>
          <Button
            type="dashed"
            danger
            onClick={() => {
              setSelectedListening(record);
              setDeleteModalVisible(true);
            }}
          >
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
            onChange={(e) => setType(e)}
            style={{ width: 200 }}
          >
            <Option value="all">All</Option>
            <Option value="easy">Reading Passage 1</Option>
            <Option value="medium">Reading Passage 2</Option>
            <Option value="hard">Reading Passage 3</Option>
          </Select>
          <Button
            type="primary"
            onClick={() => navigate("/dashboard/ielts/reading/create")}
          >
            Add New Reading
          </Button>
        </div>
      </div>
      <div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "24px" }}>
            <Spin size="large" />
          </div>
        ) 
        // : data?.code !== 200 || error ? (
        //   <Result
        //     subTitle="You have not added any reading passage yet, please add one."
        //     style={{ textAlign: "center", padding: "24px" }}
        //     icon={
        //       <img
        //         src={emptyCart}
        //         alt="No Data"
        //         style={{ width: "300px", height: "300px" }}
        //       />
        //     }
        //     extra={
        //       <Button
        //         type="primary"
        //         onClick={() => navigate("/dashboard/ielts/reading/create")}
        //       >
        //         Add New Reading
        //       </Button>
        //     }
        //   />
        // ) 
        : (
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
            <Button onClick={() => setDeleteModalVisible(false)}>Cancel</Button>
            <Button danger onClick={handleDelete}>
              Confirm
            </Button>
          </>
        )}
      >
        <p>
          Are you sure you want to delete the reading
          <b>"{selectedListening?.title}"</b>?
        </p>
      </Modal>
    </div>
  );
};

export default Reading;
