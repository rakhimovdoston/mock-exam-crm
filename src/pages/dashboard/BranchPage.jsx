import React, { useEffect, useState } from "react";
import useApiRequest from "../../hooks/useApiRequest";
import {
  Button,
  Flex,
  Form,
  Input,
  Modal,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";
import apiClient from "../../services/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const BranchPage = () => {
  const [refresh, setRefresh] = useState(0);
  const [uploadLoading, setUpdateLoading] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [showPackageCreate, setShowPackageCreate] = useState(false);
  const [showPackageUpdate, setShowPackageUpdate] = useState(false);
  const [packageCreateLoading, setPackageCreateLoading] = useState(false);
  const [packageUpdateLoading, setPackageUpdateLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState();
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
  const [createForm] = Form.useForm();
  const [packageForm] = Form.useForm();
  const [packageCreateForm] = Form.useForm();

  useEffect(() => {
    if (selectBranch) {
      form.setFieldsValue({
        name: selectBranch.name,
        maxStudents: selectBranch.maxStudents,
      });
    }
  }, [selectBranch, form]);

  useEffect(() => {
    if (selectedPackage) {
      packageForm.setFieldsValue({
        name: selectedPackage.name,
        price: selectedPackage.price,
        totalSessions: selectedPackage.totalSessions,
        speakingSessions: selectedPackage.speakingSessions,
        durationWeeks: selectedPackage.durationWeeks,
        branchId:
          selectedPackage.branchId || selectedPackage.branch?.id || undefined,
      });
    } else {
      packageForm.resetFields();
    }
  }, [selectedPackage, packageForm]);

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
      title: "Duration (weeks)",
      dataIndex: "durationWeeks",
      key: "durationWeeks",
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
          <Button
            onClick={() => {
              setSelectedPackage(record);
              setShowPackageUpdate(true);
            }}
          >
            Update
          </Button>
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

  const normalizePackagePayload = (values) => {
    const payload = { ...values };
    const numericFields = [
      "price",
      "totalSessions",
      "speakingSessions",
      "durationWeeks",
    ];
    numericFields.forEach((field) => {
      if (
        payload[field] !== undefined &&
        payload[field] !== null &&
        payload[field] !== ""
      ) {
        payload[field] = Number(payload[field]);
      }
    });
    if (!payload.branchId) {
      delete payload.branchId;
    }
    return payload;
  };

  const handleCreateBranch = async () => {
    let values;
    try {
      values = await createForm.validateFields();
    } catch {
      return;
    }

    setCreateLoading(true);
    try {
      const response = await apiClient.post("api/v1/branch/create", values);
      if (response.code !== 200) {
        toast.error(response.message || "Failed to create branch");
        return;
      }

      toast.success("Branch created");
      setShowCreate(false);
      createForm.resetFields();
      setRefresh((prev) => prev + 1);
    } catch (err) {
      toast.error(err.message || "Failed to create branch");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreatePackage = async () => {
    let values;
    try {
      values = await packageCreateForm.validateFields();
    } catch {
      return;
    }

    setPackageCreateLoading(true);
    const payload = normalizePackagePayload(values);

    try {
      const response = await apiClient.post(
        "api/v1/branch/package/create",
        payload
      );
      if (response.code !== 200) {
        toast.error(response.message || "Failed to create package");
        return;
      }
      toast.success("Package created");
      packageCreateForm.resetFields();
      setShowPackageCreate(false);
      setRefresh((prev) => prev + 1);
    } catch (err) {
      toast.error(err.message || "Failed to create package");
    } finally {
      setPackageCreateLoading(false);
    }
  };

  const handleUpdatePackage = async () => {
    if (!selectedPackage) return;

    let values;
    try {
      values = await packageForm.validateFields();
    } catch {
      return;
    }

    setPackageUpdateLoading(true);
    const payload = normalizePackagePayload(values);

    try {
      const response = await apiClient.put(
        `api/v1/branch/package/update/${selectedPackage.id}`,
        payload
      );
      if (response.code !== 200) {
        toast.error(response.message || "Failed to update package");
        return;
      }
      toast.success("Package updated");
      setShowPackageUpdate(false);
      setSelectedPackage(undefined);
      setRefresh((prev) => prev + 1);
    } catch (err) {
      toast.error(err.message || "Failed to update package");
    } finally {
      setPackageUpdateLoading(false);
    }
  };

  return (
    <>
      <div>
        <Flex justify="space-between" align="center">
          <Typography.Title level={3}>Venues</Typography.Title>
          <Button
            type="primary"
            onClick={() => {
              createForm.resetFields();
              setShowCreate(true);
            }}
          >
            Add New Venue
          </Button>
        </Flex>
        <Table
          key={"branch"}
          loading={loading}
          dataSource={data?.data?.branches}
          columns={columns}
          rowKey="id"
          pagination={{ position: ["none", "none"] }}
        />
      </div>
      <Modal
        title="Add New Branch"
        open={showCreate}
        onCancel={() => {
          setShowCreate(false);
          createForm.resetFields();
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setShowCreate(false);
              createForm.resetFields();
            }}
          >
            Cancel
          </Button>,
          <Button
            key="create"
            type="primary"
            loading={createLoading}
            disabled={createLoading}
            onClick={handleCreateBranch}
          >
            Save
          </Button>,
        ]}
      >
        <Form layout="vertical" form={createForm}>
          <Form.Item
            name="name"
            label="Name"
            rules={[
              { required: true, message: "Please enter the branch name" },
            ]}
          >
            <Input placeholder="Enter branch name" />
          </Form.Item>
          <Form.Item
            name="maxStudents"
            label="Max Students"
            rules={[
              {
                required: true,
                message: "Please enter the branch max students",
              },
            ]}
          >
            <Input type="number" placeholder="Enter max students" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Add New Package"
        open={showPackageCreate}
        onCancel={() => {
          setShowPackageCreate(false);
          packageCreateForm.resetFields();
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setShowPackageCreate(false);
              packageCreateForm.resetFields();
            }}
          >
            Cancel
          </Button>,
          <Button
            key="create"
            type="primary"
            loading={packageCreateLoading}
            disabled={packageCreateLoading}
            onClick={handleCreatePackage}
          >
            Save
          </Button>,
        ]}
      >
        <Form layout="vertical" form={packageCreateForm}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please enter package name" }]}
          >
            <Input placeholder="Enter package name" />
          </Form.Item>
          <Form.Item
            name="price"
            label="Price"
            rules={[{ required: true, message: "Please enter price" }]}
          >
            <Input type="number" placeholder="Enter price" />
          </Form.Item>
          <Form.Item
            name="totalSessions"
            label="Total Sessions"
            rules={[{ required: true, message: "Enter total sessions count" }]}
          >
            <Input type="number" placeholder="Total sessions" />
          </Form.Item>
          <Form.Item
            name="speakingSessions"
            label="Speaking Sessions"
            rules={[
              { required: true, message: "Enter speaking sessions count" },
            ]}
          >
            <Input type="number" placeholder="Speaking sessions" />
          </Form.Item>
          <Form.Item
            name="durationWeeks"
            label="Duration (weeks)"
            rules={[{ required: true, message: "Enter duration in weeks" }]}
          >
            <Input type="number" placeholder="Duration in weeks" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={
          selectedPackage
            ? `Update "${selectedPackage.name}"`
            : "Update Package"
        }
        open={showPackageUpdate}
        onCancel={() => {
          setShowPackageUpdate(false);
          setSelectedPackage(undefined);
          packageForm.resetFields();
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setShowPackageUpdate(false);
              setSelectedPackage(undefined);
              packageForm.resetFields();
            }}
          >
            Close
          </Button>,
          <Button
            key="update"
            type="primary"
            loading={packageUpdateLoading}
            disabled={packageUpdateLoading}
            onClick={handleUpdatePackage}
          >
            Update
          </Button>,
        ]}
      >
        <Form layout="vertical" form={packageForm}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please enter package name" }]}
          >
            <Input placeholder="Enter package name" />
          </Form.Item>
          <Form.Item
            name="price"
            label="Price"
            rules={[{ required: true, message: "Please enter price" }]}
          >
            <Input type="number" placeholder="Enter price" />
          </Form.Item>
          <Form.Item
            name="totalSessions"
            label="Total Sessions"
            rules={[{ required: true, message: "Enter total sessions count" }]}
          >
            <Input type="number" placeholder="Total sessions" />
          </Form.Item>
          <Form.Item
            name="speakingSessions"
            label="Speaking Sessions"
            rules={[
              { required: true, message: "Enter speaking sessions count" },
            ]}
          >
            <Input type="number" placeholder="Speaking sessions" />
          </Form.Item>
          <Form.Item
            name="durationWeeks"
            label="Duration (weeks)"
            rules={[{ required: true, message: "Enter duration in weeks" }]}
          >
            <Input type="number" placeholder="Duration in weeks" />
          </Form.Item>
          {/* <Form.Item name="branchId" label="Branch (optional)">
            <Select
              allowClear
              placeholder="Select branch"
              options={data?.data?.branches?.map((branch) => ({
                value: branch.id,
                label: branch.name,
              }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item> */}
        </Form>
      </Modal>
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
              rules={[
                { required: true, message: "Please enter the branch name" },
              ]}
            >
              <Input placeholder="Enter branch name" />
            </Form.Item>
            <Form.Item
              name={"maxStudents"}
              label="Max Students"
              rules={[
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
          <Button
            type="primary"
            onClick={() => {
              packageCreateForm.resetFields();
              setShowPackageCreate(true);
            }}
          >
            Add New Package
          </Button>
        </Flex>
        <Table
          key={"package"}
          loading={loading}
          dataSource={data?.data?.packages}
          columns={columnsPackages}
          rowKey="id"
          pagination={{ position: ["none", "none"] }}
        />
      </div>
    </>
  );
};

export default BranchPage;
