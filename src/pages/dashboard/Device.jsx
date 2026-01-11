import React, { useMemo, useState } from "react";
import { Alert, Button, Card, Modal, Table, Typography, message } from "antd";
import useApiRequest from "../../hooks/useApiRequest";
import apiClient from "../../services/api";

const Device = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading, error } = useApiRequest("api/v/v1/device/all", [
    refreshKey,
  ]);

  const devices = useMemo(() => {
    if (Array.isArray(data?.data?.devices)) {
      return data.data.devices;
    }
    if (Array.isArray(data?.data)) {
      return data.data;
    }
    return [];
  }, [data]);

  const columns = useMemo(() => {
    if (!devices.length) {
      return [
        {
          title: "Device ID",
          dataIndex: "deviceId",
          key: "deviceId",
          render: (value, _, index) => value ?? `#${index + 1}`,
        },
        {
          title: "Created by",
          dataIndex: "createBy",
          key: "createBy",
          render: (value) => value ?? "-",
        },
      ];
    }

    return Object.keys(devices[0]).map((key) => ({
      title: key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase()),
      dataIndex: key,
      key,
      render: (value) =>
        value === null || value === undefined ? "-" : String(value),
    }));
  }, [devices]);

  const closeModal = () => setIsModalOpen(false);

  const okHandle = async () => {
    setIsSubmitting(true);
    try {
      const response = await apiClient.get("api/v/v1/device/set-device");
      const payload = response?.data ?? response;

      if (response?.code && response.code !== 200) {
        throw new Error("Failed to add device");
      }

      const { deviceId, deviceSecret } = payload || {};

      if (!deviceId || !deviceSecret) {
        message.error("Device credentials are missing in the response");
        return;
      }

      localStorage.setItem("deviceId", deviceId);
      localStorage.setItem("deviceSecret", deviceSecret);

      message.success("Success Add Device");
      setIsModalOpen(false);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error("Add device error:", err);
      message.error("Failed to add device");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          gap: 12,
        }}
      >
        <Typography.Title level={3} style={{ margin: 0 }}>
          Devices
        </Typography.Title>
        <Button type="primary" onClick={() => setIsModalOpen(true)}>
          Add Device
        </Button>
      </div>

      {error && (
        <Alert
          type="error"
          message="Failed to load devices"
          description={
            error.message ||
            "Something went wrong while fetching the device list."
          }
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Table
        loading={loading}
        dataSource={devices}
        columns={columns}
        rowKey={(record, index) => record?.id ?? record?.deviceId ?? index}
        pagination={false}
        locale={{
          emptyText: loading ? " " : "No devices found",
        }}
      />

      <Modal
        title="Add Device"
        open={isModalOpen}
        onOk={okHandle}
        onCancel={closeModal}
        okText="Confirm"
        cancelText="Cancel"
        confirmLoading={isSubmitting}
      >
        <Typography.Paragraph strong style={{ marginBottom: 12 }}>
          Are you sure you want to add this device?
        </Typography.Paragraph>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Confirm to add this device to the system.
        </Typography.Paragraph>
      </Modal>
    </Card>
  );
};

export default Device;
