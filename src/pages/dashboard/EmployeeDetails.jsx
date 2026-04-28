import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useApiRequest from "../../hooks/useApiRequest";
import {
  Button,
  Card,
  Checkbox,
  Descriptions,
  Flex,
  Form,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  TimePicker,
  Typography,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import apiClient from "../../services/api";
import { toast } from "react-toastify";
import dayjs from "dayjs";

const { Text } = Typography;

const DAYS_OF_WEEK = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const DAY_LABELS = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

const EmployeeDetails = () => {
  const { id } = useParams();
  const [refresh, setRefresh] = useState(1);
  const { data, loading } = useApiRequest(`api/v1/admin/user/by/${id}`, [id]);

  const { data: workTimesData, loading: workTimesLoading } = useApiRequest(
    `api/v1/speaking/get-all/work-time/${id}`,
    [id, refresh]
  );

  const [roles, setRoles] = useState([]);
  const [active, setActive] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Transfer modal state
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [speakers, setSpeakers] = useState([]);
  const [speakersLoading, setSpeakersLoading] = useState(false);
  const [selectedSpeakerId, setSelectedSpeakerId] = useState(null);

  useEffect(() => {
    if (data?.data) {
      setRoles(data.data.roles || []);
      setActive(data.data.active || false);
    }
  }, [data]);

  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [adding, setAdding] = useState(false);

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <Spin size="large" />
      </div>
    );
  }
  if (!data) {
    return <div>No data found</div>;
  }

  const handleRoleChange = (checkedValues) => {
    setRoles(checkedValues);
  };

  const handleStatusChange = async (checked) => {
    // Agar o'chirilayotgan bo'lsa va ROLE_SPEAKER roli bo'lsa
    if (!checked && roles.includes("ROLE_SPEAKER")) {
      const branchId = data.data.branchId;

      if (!branchId) {
        toast.warn("Branch ID not found!");
        setActive(false);
        return;
      }

      setTransferModalOpen(true);
      setSpeakersLoading(true);
      setSelectedSpeakerId(null);

      try {
        const res = await apiClient.get(`api/v1/branch/speakers/${branchId}`);
        const allSpeakers = res?.data || [];
        // Joriy xodimni ro'yxatdan chiqarib tashlash
        const filtered = allSpeakers.filter((s) => s.id !== data.data.id);
        setSpeakers(filtered);
      } catch (err) {
        toast.error("Failed to load speakers!");
        setTransferModalOpen(false);
      } finally {
        setSpeakersLoading(false);
      }
    } else {
      setActive(checked);
    }
  };

  const handleTransferConfirm = () => {
    if (!selectedSpeakerId) {
      toast.warn("Please select a speaker to transfer students to!");
      return;
    }
    setActive(false);
    setTransferModalOpen(false);
  };

  const handleTransferCancel = () => {
    setTransferModalOpen(false);
    setSelectedSpeakerId(null);
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      let body = { roles, active };
      if (!active && selectedSpeakerId) {
        body.transferToSpeakerId = selectedSpeakerId;
      }

      console.log("Update body:", body);
      
      await apiClient.put(`api/v1/admin/user/roles/update/${data.data.id}`, body);
      toast.success("Updated successfully!");
      setRefresh((prev) => prev + 1);
    } catch (err) {
      toast.error("Failed to update!");
    } finally {
      setUpdating(false);
    }
  };

  const workHoursAdd = async () => {
    toast.success("This is service not available now");
  };

  const handleDeleteWorkTime = async (workTimeId) => {
    try {
      const response = await apiClient.delete(
        `api/v1/speaking/delete/word-time/${workTimeId}`
      );

      if (response.code != 200) {
        toast.warn(response.message || "Work time not deleted!");
        return;
      }
      setRefresh((prev) => prev + 1);
    } catch (err) {
      toast.error("Failed something!");
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <Card
        title="Employee Details"
        extra={
          <Button type="primary" loading={updating} onClick={handleUpdate}>
            Update
          </Button>
        }
      >
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Full Name">
            {data?.data.firstname} {data?.data.lastname}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {data?.data.email || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Username">
            {data?.data.username}
          </Descriptions.Item>
          <Descriptions.Item label="Phone">
            {data?.data.phone || "N/A"}
          </Descriptions.Item>

          <Descriptions.Item label="Roles">
            <Checkbox.Group value={roles} onChange={handleRoleChange}>
              <Checkbox value="ROLE_BRANCH_ADMIN">Mock Organiser</Checkbox>
              <Checkbox value="ROLE_SPEAKER">Speaking Examiner</Checkbox>
            </Checkbox.Group>
          </Descriptions.Item>

          {/* <Descriptions.Item label="Everester">
            {data?.data.everester ? "Yes" : "No"}
          </Descriptions.Item> */}

          <Descriptions.Item label="Status">
            <Switch
              checked={active}
              onChange={handleStatusChange}
              checkedChildren="Active"
              unCheckedChildren="Not Active"
            />
            <Tag color={active ? "green" : "red"} style={{ marginLeft: 10 }}>
              {active ? "Active" : "Not Active"}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Transfer Modal */}
      <Modal
        title="Transfer Students"
        open={transferModalOpen}
        onOk={handleTransferConfirm}
        onCancel={handleTransferCancel}
        okText="Confirm"
        cancelText="Cancel"
        okButtonProps={{ disabled: !selectedSpeakerId }}
      >
        <p style={{ marginBottom: 12 }}>
          This speaker is being deactivated. Please select a speaker to transfer all their students to.
        </p>
        {speakersLoading ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <Spin />
          </div>
        ) : speakers.length === 0 ? (
          <p style={{ color: "#ff4d4f" }}>
            No other active speakers found in this branch.
          </p>
        ) : (
          <Select
            style={{ width: "100%" }}
            placeholder="Select a speaker"
            value={selectedSpeakerId}
            onChange={setSelectedSpeakerId}
            options={speakers.map((s) => ({
              value: s.id,
              label: `${s.firstname} ${s.lastname} (${s.username})`,
            }))}
          />
        )}
      </Modal>

      {roles.includes("ROLE_SPEAKER") && (
        <SpeakingScheduleSection speakerId={id} />
      )}

      <Card
        title="Work Shifts"
        style={{ marginTop: 20 }}
        extra={
          <>
            <TimePicker
              value={startTime}
              onChange={setStartTime}
              format="HH:mm"
              placeholder="Start Time"
            />
            <TimePicker
              value={endTime}
              onChange={setEndTime}
              format="HH:mm"
              placeholder="End Time"
              style={{ marginLeft: 8 }}
            />
            <Button
              type="primary"
              onClick={workHoursAdd}
              loading={adding}
              style={{ marginLeft: 8 }}
            >
              Add
            </Button>
          </>
        }
      >
        {workTimesLoading ? (
          <Spin />
        ) : workTimesData?.data?.length > 0 ? (
          workTimesData.data.map((wt) => {
            const startFormatted = dayjs(wt.start, "HH:mm").format("HH:mm");
            const endFormatted = dayjs(wt.end, "HH:mm").format("HH:mm");

            const workedHours = (() => {
              const start = dayjs(wt.start, "HH:mm");
              const end = dayjs(wt.end, "HH:mm");
              const diff = end.diff(start, "minute");
              const hours = Math.floor(diff / 60);
              const minutes = diff % 60;
              return `${hours}h ${minutes}m`;
            })();

            return (
              <div
                key={wt.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid #f0f0f0",
                  padding: "8px 0",
                }}
              >
                <span style={{ fontSize: "15px" }}>
                  🕒 {startFormatted} → {endFormatted}{" "}
                  <span style={{ color: "#888" }}>({workedHours})</span>
                </span>
                <Popconfirm
                  title="Do you want to delete work hours?"
                  onConfirm={() => handleDeleteWorkTime(wt.id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button type="link" danger>
                    Delete
                  </Button>
                </Popconfirm>
              </div>
            );
          })
        ) : (
          <div>No working hours included</div>
        )}
      </Card>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SPEAKING SCHEDULE SECTION
// ─────────────────────────────────────────────────────────────────────────────

const SpeakingScheduleSection = ({ speakerId }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = add, object = edit
  const [defaultDay, setDefaultDay] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form] = Form.useForm();

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(
        `api/v1/speaking/schedule?user_id=${speakerId}`
      );
      if (res.success) {
        setSchedules(res.data || []);
      } else {
        toast.error(res.message || "Failed to load schedule");
      }
    } catch {
      toast.error("Failed to load speaking schedule");
    } finally {
      setLoading(false);
    }
  }, [speakerId]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Group schedules by day
  const scheduleByDay = DAYS_OF_WEEK.map((day) => ({
    key: day,
    day,
    slots: schedules.filter((s) => s.day_of_week === day),
  }));

  const openAdd = (day) => {
    setEditing(null);
    setDefaultDay(day);
    form.setFieldsValue({ day_of_week: day, start_time: null, end_time: null });
    setModalOpen(true);
  };

  const openEdit = (slot) => {
    setEditing(slot);
    setDefaultDay(slot.day_of_week);
    form.setFieldsValue({
      day_of_week: slot.day_of_week,
      start_time: dayjs(slot.start_time, "HH:mm"),
      end_time: dayjs(slot.end_time, "HH:mm"),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setDefaultDay(null);
    form.resetFields();
  };

  const handleSave = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setSaving(true);
    try {
      const payload = {
        user_id: Number(speakerId),
        day_of_week: values.day_of_week,
        start_time: dayjs(values.start_time).format("HH:mm"),
        end_time: dayjs(values.end_time).format("HH:mm"),
      };
      const res = editing
        ? await apiClient.put(
            `api/v1/speaking/schedule/${editing.id}`,
            payload
          )
        : await apiClient.post("api/v1/speaking/schedule", payload);

      if (res.success) {
        toast.success(editing ? "Schedule updated" : "Schedule added");
        closeModal();
        fetchSchedules();
      } else {
        toast.error(res.message || "Something went wrong");
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to save schedule"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slot) => {
    setDeletingId(slot.id);
    try {
      const res = await apiClient.delete(
        `api/v1/speaking/schedule/${slot.id}`
      );
      if (res.success) {
        toast.success("Schedule deleted");
        fetchSchedules();
      } else {
        toast.error(res.message || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete schedule");
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    {
      title: "Day",
      dataIndex: "day",
      key: "day",
      width: 120,
      render: (day) => <Text strong>{DAY_LABELS[day]}</Text>,
    },
    {
      title: "Time Ranges",
      key: "slots",
      render: (_, record) => {
        if (!record.slots.length) {
          return <Text type="secondary" italic>No schedule</Text>;
        }
        return (
          <Flex wrap="wrap" gap={6}>
            {record.slots.map((slot) => (
              <Tag
                key={slot.id}
                color="blue"
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px" }}
              >
                <span>
                  {slot.start_time} – {slot.end_time}
                </span>
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  style={{ padding: 0, height: 16, color: "inherit" }}
                  onClick={() => openEdit(slot)}
                />
                <Popconfirm
                  title="Delete this time range?"
                  okText="Yes"
                  cancelText="No"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => handleDelete(slot)}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    loading={deletingId === slot.id}
                    style={{ padding: 0, height: 16, color: "inherit" }}
                  />
                </Popconfirm>
              </Tag>
            ))}
          </Flex>
        );
      },
    },
    {
      title: "",
      key: "add",
      width: 60,
      align: "right",
      render: (_, record) => (
        <Button
          type="dashed"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => openAdd(record.day)}
        />
      ),
    },
  ];

  return (
    <>
      <Card
        title="Speaking Schedule"
        style={{ marginTop: 20 }}
        styles={{ body: { padding: 0 } }}
      >
        {loading ? (
          <Flex justify="center" align="center" style={{ minHeight: 150, padding: 24 }}>
            <Spin />
          </Flex>
        ) : (
          <Table
            columns={columns}
            dataSource={scheduleByDay}
            rowKey="key"
            pagination={false}
            size="small"
          />
        )}
      </Card>

      <Modal
        title={
          editing
            ? `Edit — ${DAY_LABELS[editing.day_of_week]}`
            : defaultDay
            ? `Add — ${DAY_LABELS[defaultDay]}`
            : "Add Schedule"
        }
        open={modalOpen}
        onCancel={closeModal}
        footer={[
          <Button key="cancel" onClick={closeModal}>
            Cancel
          </Button>,
          <Button key="save" type="primary" loading={saving} onClick={handleSave}>
            Save
          </Button>,
        ]}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="day_of_week"
            label="Day"
            rules={[{ required: true, message: "Please select a day" }]}
          >
            <Select disabled={!!editing}>
              {DAYS_OF_WEEK.map((day) => (
                <Select.Option key={day} value={day}>
                  {DAY_LABELS[day]}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Space size={12} style={{ width: "100%" }}>
            <Form.Item
              name="start_time"
              label="Start Time"
              rules={[{ required: true, message: "Required" }]}
              style={{ marginBottom: 0 }}
            >
              <TimePicker format="HH:mm" minuteStep={5} placeholder="09:00" />
            </Form.Item>
            <Form.Item
              name="end_time"
              label="End Time"
              rules={[{ required: true, message: "Required" }]}
              style={{ marginBottom: 0 }}
            >
              <TimePicker format="HH:mm" minuteStep={5} placeholder="12:00" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </>
  );
};

export default EmployeeDetails;
