import React, { useMemo, useState } from "react";
import { Alert, Button, Card, Modal, Table, Typography, message } from "antd";
import useApiRequest from "../../hooks/useApiRequest";
import apiClient from "../../services/api";
import { useT } from "../../i18n/useT";

const Device = () => {
  const t = useT();
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
          title: t("devices.deviceId"),
          dataIndex: "deviceId",
          key: "deviceId",
          render: (value, _, index) => value ?? `#${index + 1}`,
        },
        {
          title: t("devices.createdBy"),
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
  }, [devices, t]);

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
          {t("devices.title")}
        </Typography.Title>
        <Button type="primary" onClick={() => setIsModalOpen(true)}>
          {t("devices.addDevice")}
        </Button>
      </div>

      {error && (
        <Alert
          type="error"
          message={t("devices.loadFailed")}
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
          emptyText: loading ? " " : t("devices.noDevices"),
        }}
      />

      <Modal
        title={t("devices.addDevice")}
        open={isModalOpen}
        onOk={okHandle}
        onCancel={closeModal}
        okText={t("common.confirmBtn")}
        cancelText={t("common.cancel")}
        confirmLoading={isSubmitting}
      >
        <Typography.Paragraph strong style={{ marginBottom: 12 }}>
          {t("devices.addConfirm")}
        </Typography.Paragraph>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {t("devices.addConfirmDesc")}
        </Typography.Paragraph>
      </Modal>
    </Card>
  );
};

export default Device;
