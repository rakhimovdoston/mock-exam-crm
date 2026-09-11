import React, { useState } from "react";
import {
  Modal,
  Form,
  Select,
  DatePicker,
  Checkbox,
  Button,
  Alert,
  Table,
  Typography,
  Tag,
} from "antd";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import apiClient from "../../services/api";
import useApiRequest from "../../hooks/useApiRequest";
import { useT } from "../../i18n/useT";

const { Text } = Typography;

const RecheckWritingModal = ({ open, onClose }) => {
  const t = useT();
  const TEST_TIME_OPTIONS = [
    { value: "all", label: t("common.all") },
    { value: "morning", label: t("common.morning") },
    { value: "afternoon", label: t("common.afternoon") },
    { value: "evening", label: t("common.evening") },
  ];
  const [branchId, setBranchId] = useState();
  const [date, setDate] = useState(dayjs());
  const [testTime, setTestTime] = useState("all");
  const [onlyUnchecked, setOnlyUnchecked] = useState(false);
  const [sendSms, setSendSms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Branch list for the select
  const { data: branchData, loading: branchLoading } =
    useApiRequest("api/v1/branch/all");
  const branches = branchData?.data?.branches || [];

  const resetAndClose = () => {
    setResult(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!branchId) return;

    const params = new URLSearchParams();
    params.set("branchId", branchId);
    params.set("date", date.format("YYYY-MM-DD"));
    if (testTime !== "all") params.set("testTime", testTime);
    params.set("onlyUnchecked", String(onlyUnchecked));
    params.set("sendSms", String(sendSms));

    setLoading(true);
    setResult(null);
    try {
      const res = await apiClient.post(
        `api/v1/history/recheck-writing?${params.toString()}`
      );
      if (!res?.success) {
        toast.error(res?.message || t("recheck.failed"));
        return;
      }
      setResult(res.data);
    } catch (e) {
      toast.error(e?.response?.data?.message || t("recheck.failed"));
    } finally {
      setLoading(false);
    }
  };

  const itemColumns = [
    {
      title: "№",
      key: "index",
      width: 50,
      render: (_, __, index) => index + 1,
    },
    {
      title: t("recheck.student"),
      dataIndex: "studentName",
      key: "studentName",
    },
    {
      title: t("common.time"),
      dataIndex: "testTime",
      key: "testTime",
      width: 110,
      render: (val) => (val ? <Tag color="blue">{val}</Tag> : "-"),
    },
  ];

  return (
    <Modal
      title={t("recheck.title")}
      open={open}
      onCancel={resetAndClose}
      destroyOnClose
      maskClosable={false}
      footer={[
        <Button key="cancel" onClick={resetAndClose}>
          {t("common.close")}
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          disabled={!branchId}
          onClick={handleSubmit}
        >
          {t("recheck.start")}
        </Button>,
      ]}
    >
      <Form layout="vertical">
        <Form.Item label={t("recheck.branch")} required>
          <Select
            placeholder={t("recheck.selectBranch")}
            value={branchId}
            loading={branchLoading}
            onChange={setBranchId}
            showSearch
            optionFilterProp="label"
            options={branches.map((b) => ({ value: b.id, label: b.name }))}
          />
        </Form.Item>

        <Form.Item label={t("recheck.date")}>
          <DatePicker
            style={{ width: "100%" }}
            value={date}
            allowClear={false}
            onChange={(val) => setDate(val || dayjs())}
          />
        </Form.Item>

        <Form.Item label={t("recheck.time")}>
          <Select
            value={testTime}
            onChange={setTestTime}
            options={TEST_TIME_OPTIONS}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 8 }}>
          <Checkbox
            checked={onlyUnchecked}
            onChange={(e) => setOnlyUnchecked(e.target.checked)}
          >
            {t("recheck.onlyUnchecked")}
          </Checkbox>
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Checkbox
            checked={sendSms}
            onChange={(e) => setSendSms(e.target.checked)}
          >
            {t("recheck.resend")}
          </Checkbox>
        </Form.Item>
      </Form>

      {result && (
        <div style={{ marginTop: 16 }}>
          <Alert
            type={result.total > 0 ? "success" : "info"}
            showIcon
            message={result.message}
            description={
              result.total > 0 ? (
                <Text>
                  {t("recheck.queued")}: <Text strong>{result.total}</Text>{" "}
                  {t("recheck.students")}
                </Text>
              ) : null
            }
          />
          {Array.isArray(result.items) && result.items.length > 0 && (
            <Table
              style={{ marginTop: 12 }}
              size="small"
              rowKey={(r) => r.examId ?? r.userId}
              dataSource={result.items}
              columns={itemColumns}
              pagination={false}
              scroll={{ y: 240 }}
            />
          )}
        </div>
      )}
    </Modal>
  );
};

export default RecheckWritingModal;
