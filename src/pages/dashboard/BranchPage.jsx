import React, { useEffect, useState } from "react";
import useApiRequest from "../../hooks/useApiRequest";
import { Button, Flex, Form, Input, Modal, Table, Tag, Typography } from "antd";
import apiClient from "../../services/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const BranchPage = () => {
  const [refresh, setRefresh] = useState(0);
  const [uploadLoading, setUpdateLoading] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [selectBranch, setSelectBranch] = useState();
  const { data, loading } = useApiRequest("api/v1/branch/all?active=false", [
    refresh,
  ]);

  const navigate = useNavigate();

  const activedBranch = async (id, active, type) => {
    try {
      const response = await apiClient.get(
        `api/v1/${type}/active/${id}?active=${!active}`
      );
      if (response.code !== 200) {
        toast.error(response.message || `Failed update ${type}`);
      }
      toast.success(`Successfull update ${type}`);
      setRefresh((prev) => prev + 1);
    } catch (err) {
      toast.error(err.message || `Failed update ${type}`);
    }
  };
  const [form] = Form.useForm();

  useEffect(() => {
    if (selectBranch) {
      form.setFieldsValue({
        name: selectBranch.name,
        maxStudents: selectBranch.maxStudents,
      });
    }
  }, [selectBranch]);

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Status",
      dataIndex: "active",
      key: "active",
      render: (active) => (
        <Tag color={active ? "blue" : "red"}>
          {active ? "ACTIVE" : "INACTIVE"}
        </Tag>
      ),
    },
    {
      title: "Branch",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Maximum Capacity",
      dataIndex: "maxStudents",
      key: "maxStudents",
    },
    {
      title: "Actions",
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
            danger={record.active}
            onClick={() => activedBranch(record.id, record.active, "branch")}
          >
            {record.active ? "Deactivate" : "Activation"}
          </Button>
          <Button
            onClick={() => {
              setShowUpdate(true);
              setSelectBranch(record);
            }}
          >
            Update
          </Button>
          <Button
            type="primary"
            onClick={() => {
              navigate(`/dashboard/venue/${record.id}`);
            }}
          >
            View
          </Button>
        </div>
      ),
    },
  ];
  const columnsPackages = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Status",
      dataIndex: "active",
      key: "active",
      render: (active) => (
        <Tag color={active ? "blue" : "red"}>
          {active ? "ACTIVE" : "IN_ACTIVE"}
        </Tag>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price) => (
        <div>
          <span>{price}</span>
          <span> sum</span>
        </div>
      ),
    },
    {
      title: "Total Test Sessions",
      dataIndex: "totalSessions",
      key: "totalSessions",
    },
    {
      title: "Total Speaking Sessions",
      dataIndex: "speakingSessions",
      key: "speakingSessions",
    },
    {
      title: "Actions",
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
            danger={record.active}
            onClick={() => activedBranch(record.id, record.active, "package")}
          >
            {record.active ? "Deactivated" : "Activation"}
          </Button>
          <Button>Update</Button>
        </div>
      ),
    },
  ];
  const updateBranch = async () => {
    const validate = await form.validateFields();
    setUpdateLoading(true);
    try {
      const response = await apiClient.put(
        `api/v1/branch/update/${selectBranch.id}`,
        validate
      );
      if (response.code != 200) {
        toast.error(response.message || "Failed update branch");
        return;
      }
      setRefresh((prev) => prev + 1);
      setShowUpdate(false);
    } catch (err) {
      toast.error(err.message || "Failed update branch");
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <>
      <div>
        <Flex justify="space-between" align="center">
          <Typography.Title level={3}>Venues</Typography.Title>
          <Button type="primary">Add New Venue</Button>
        </Flex>
        <Table
          key={"branch"}
          loading={loading}
          dataSource={data?.data?.branches}
          columns={columns}
          pagination={{ position: ["none", "none"] }}
        />
      </div>
      {selectBranch && (
        <Modal
          title={`Update "${selectBranch.name}"`}
          open={showUpdate}
          onCancel={() => {
            setSelectBranch();
            setShowUpdate(false);
          }}
          footer={[
            <Button key="close" onClick={() => setShowUpdate(false)}>
              Close
            </Button>,
            <Button
              key={"update"}
              loading={uploadLoading}
              disabled={uploadLoading}
              onClick={updateBranch}
              type="primary"
            >
              Update
            </Button>,
          ]}
        >
          <Form layout="vertical" form={form}>
            <Form.Item
              name={"name"}
              label="Name"
              required={[
                { required: true, message: "Please enter the branch name" },
              ]}
            >
              <Input placeholder="Enter branch name" />
            </Form.Item>
            <Form.Item
              name={"maxStudents"}
              label="Max Students"
              required={[
                {
                  required: true,
                  message: "Please enter the branch max students",
                },
              ]}
            >
              <Input placeholder="Enter Max Students" />
            </Form.Item>
          </Form>
        </Modal>
      )}
      <div>
        <Flex justify="space-between" align="center">
          <Typography.Title level={3}>Packages</Typography.Title>
          <Button type="primary">Add New Package</Button>
        </Flex>
        <Table
          key={"package"}
          loading={loading}
          dataSource={data?.data?.packages}
          columns={columnsPackages}
          pagination={{ position: ["none", "none"] }}
        />
      </div>
    </>
  );
};

export default BranchPage;
