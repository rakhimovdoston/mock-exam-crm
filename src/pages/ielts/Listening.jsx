import React, { useState, useEffect } from "react";
import { Select, Button, Spin, Table, Tag, Modal, message } from "antd";
import { useNavigate } from "react-router-dom";
import ListeningModal from "../../components/modal/ListeningModal";
import useApiRequest from "../../hooks/useApiRequest";
import { toast } from "react-toastify";
import apiClient from "../../services/api";

const { Option } = Select;

const Listening = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedListening, setSelectedListening] = useState(null);
  const [type, setType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // Number of items per page
  const navigate = useNavigate();
  const [isRefresh, setRefresh] = useState(false);

  const { data, loading } = useApiRequest(
    `/api/v1/listening/all?type=${type}&page=${
      currentPage - 1
    }&size=${pageSize}`,
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
      case "part_1":
        return "Listening Part 1";
      case "part_2":
        return "Listening Part 2";
      case "part_3":
        return "Listening Part 3";
      default:
        return "Listening Part 4";
    }
  };

  const handleDelete = async () => {
    try {
      const response = await apiClient.delete(
        `/api/v1/listening/delete/${selectedListening.id}`
      );
      if (response.code === 200) {
        toast.success("Listening deleted successfully!");
        setDeleteModalVisible(false);
        setRefresh(!isRefresh);
      } else {
        toast.error(response.message || "Failed to delete the listening.");
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete the listening.");
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
      render: (_, record) =>
        record.active ? (
          <Tag color="green">Active </Tag>
        ) : (
          <Tag color="red">{record.error}</Tag>
        ),
    },
    {
      title: "",
      key: "actions",
      render: (_, record) => (
        <div
          style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}
        >
          <Button type="dashed" onClick={() => navigate(`${record.id}`)}>
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
            <Option value="part_1">Listening Part 1</Option>
            <Option value="part_2">Listening Part 2</Option>
            <Option value="part_3">Listening Part 3</Option>
            <Option value="part_4">Listening Part 4</Option>
          </Select>
          <Button type="primary" onClick={() => setModalVisible(true)}>
            New
          </Button>
        </div>
      </div>
      <ListeningModal visible={modalVisible} onClose={setModalVisible} />
      <div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "24px" }}>
            <Spin size="large" />
          </div>
        ) : (
          // : data?.code !== 200 ? (
          //   <Result
          //     subTitle="You have not added any listening passage yet, please add one."
          //     style={{ textAlign: "center", padding: "24px" }}
          //     icon={
          //       <img
          //         src={emptyCart}
          //         alt="No Data"
          //         style={{ width: "300px", height: "300px" }}
          //       />
          //     }
          //     extra={
          //       <Button type="primary" onClick={() => setModalVisible(true)}>
          //         Add New Listening
          //       </Button>
          //     }
          //   />
          // )
          <>
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
          </>
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
          Are you sure you want to delete the listening
          <b>"{selectedListening?.title}"</b>?
        </p>
      </Modal>
    </div>
  );
};

export default Listening;
