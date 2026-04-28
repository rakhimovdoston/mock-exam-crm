import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import useApiRequest from "../../hooks/useApiRequest";
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Empty,
  Flex,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  TimePicker,
  Typography,
} from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UserOutlined,
} from "@ant-design/icons";
import apiClient from "../../services/api";
import { toast } from "react-toastify";
import dayjs from "dayjs";

const { Title, Text } = Typography;

// ─── Constants ────────────────────────────────────────────────────────────────

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

const SLOT_OPTIONS = [
  { value: "morning", label: "Morning", color: "blue" },
  { value: "afternoon", label: "Afternoon", color: "orange" },
  { value: "evening", label: "Evening", color: "purple" },
];

const SLOT_COLOR = { morning: "blue", afternoon: "orange", evening: "purple" };
const SLOT_DEFAULT_TIME = {
  morning: "10:00",
  afternoon: "14:30",
  evening: "18:30",
};

const getSlotLabel = (slot, schedule) => {
  const time = schedule?.[`${slot}_time`] || SLOT_DEFAULT_TIME[slot];
  const name = slot.charAt(0).toUpperCase() + slot.slice(1);
  return `${name} (${time})`;
};

const SCHEDULE_BASE = "api/v1/admin/branch/schedule";
const HOLIDAY_BASE = "api/v1/admin/branch/holiday";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const handleApiError = (err, fallback = "Something went wrong") => {
  const msg = err?.response?.data?.message || err?.message || fallback;
  toast.error(msg);
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════

const BranchDetails = () => {
  const { id } = useParams();
  const [speakersLoading, setSpeakersLoading] = useState(false);
  const [speakers, setSpeakers] = useState([]);

  const { data, loading, error } = useApiRequest(
    `api/v1/branch/details/${id}`,
    []
  );

  const branch = useMemo(() => {
    if (!data?.data) return undefined;
    return data.data;
  }, [data]);

  useEffect(() => {
    const fetchSpeakers = async () => {
      setSpeakersLoading(true);
      try {
        const response = await apiClient.get(`api/v1/branch/speakers/${id}`);
        if (response.code === 200) {
          setSpeakers(response.data || []);
        } else {
          setSpeakers([]);
        }
      } catch (err) {
        setSpeakers([]);
        if (err?.response?.data?.message) {
          toast.error(err.response.data.message);
        }
      } finally {
        setSpeakersLoading(false);
      }
    };

    if (id) fetchSpeakers();
  }, [id]);

  // ── Loading / Error / Empty states ─────────────────────────────────────────

  if (loading) {
    return (
      <Flex style={{ minHeight: "50vh" }} align="center" justify="center">
        <Spin size="large" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        message="Failed to load branch"
        description={error.message}
      />
    );
  }

  if (!branch) {
    return (
      <Card>
        <Empty description="Branch not found" />
        <Space style={{ marginTop: 16 }}>
          <Link to="/dashboard/venues">Back to venues</Link>
        </Space>
      </Card>
    );
  }

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={24}>
      {/* ── Breadcrumb & Back ──────────────────────────────────────────────── */}
      <Flex justify="space-between" align="center">
        <Breadcrumb
          items={[
            { title: <Link to="/dashboard/venues">Venues</Link> },
            { title: branch.name },
          ]}
        />
        <Link to="/dashboard/venues">
          <Button>Back to venues</Button>
        </Link>
      </Flex>

      {/* ── Branch Info ────────────────────────────────────────────────────── */}
      <Card
        title={
          <Space align="center">
            <Title level={4} style={{ margin: 0 }}>
              {branch.name}
            </Title>
            <Tag color={branch.active ? "green" : "red"}>
              {branch.active ? "Active" : "Inactive"}
            </Tag>
          </Space>
        }
      >
        <Row gutter={[24, 16]}>
          <Col xs={24} sm={8}>
            <Statistic
              title="Maximum Capacity"
              value={branch.maxStudents || 0}
            />
          </Col>
          {branch.address && (
            <Col xs={24} sm={8}>
              <Text type="secondary" style={{ fontSize: 12 }}>Address</Text>
              <div>
                <Text strong>{branch.address}</Text>
              </div>
            </Col>
          )}
          {branch.phone && (
            <Col xs={24} sm={8}>
              <Text type="secondary" style={{ fontSize: 12 }}>Contact</Text>
              <div>
                <Text strong>{branch.phone}</Text>
              </div>
            </Col>
          )}
        </Row>
      </Card>

      {/* ── Speakers ───────────────────────────────────────────────────────── */}
      <Card
        title={
          <Space>
            <UserOutlined />
            <span>Speakers ({speakers.length})</span>
          </Space>
        }
        extra={
          !speakersLoading && (
            <Tag color="default">Assigned to this branch</Tag>
          )
        }
      >
        {speakersLoading ? (
          <Flex justify="center" style={{ padding: 24 }}>
            <Spin />
          </Flex>
        ) : speakers.length ? (
          <List
            dataSource={speakers}
            renderItem={(speaker) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Flex
                      align="center"
                      justify="center"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "#e6f4ff",
                        color: "#1677ff",
                        fontWeight: 600,
                        fontSize: 14,
                      }}
                    >
                      {(speaker.firstname?.[0] || "?").toUpperCase()}
                    </Flex>
                  }
                  title={`${speaker.firstname || ""} ${speaker.lastname || ""}`.trim()}
                  description={
                    <Space size={12}>
                      {speaker.phone && (
                        <Text type="secondary">{speaker.phone}</Text>
                      )}
                      {speaker.username && (
                        <Text type="secondary">@{speaker.username}</Text>
                      )}
                    </Space>
                  }
                />
                {speaker.type && (
                  <Tag color="blue">{speaker.type.replace(/_/g, " ")}</Tag>
                )}
              </List.Item>
            )}
          />
        ) : (
          <Empty description="No speakers assigned yet" />
        )}
      </Card>

      {/* ── Schedule & Holidays side by side ──────────────────────────────── */}
      <Row gutter={[24, 24]}>
        <Col xs={24} xl={12}>
          <ScheduleSection branchId={id} />
        </Col>
        <Col xs={24} xl={12}>
          <HolidaySection branchId={id} />
        </Col>
      </Row>
    </Space>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// SCHEDULE SECTION
// ═════════════════════════════════════════════════════════════════════════════

const ScheduleSection = ({ branchId }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDay, setEditingDay] = useState(null); // { day, schedule | null }
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form] = Form.useForm();

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(
        `${SCHEDULE_BASE}?branch_id=${branchId}`
      );
      if (res.code === 200) {
        setSchedules(res.data || []);
      } else {
        toast.error(res.message || "Failed to load schedule");
      }
    } catch (err) {
      handleApiError(err, "Failed to load schedule");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const scheduleMap = useMemo(() => {
    const map = {};
    (schedules || []).forEach((s) => {
      map[s.day_of_week] = s;
    });
    return map;
  }, [schedules]);

  const openAdd = (day) => {
    setEditingDay({ day, schedule: null });
    form.setFieldsValue({
      active_slots: [],
      morning_time: null,
      afternoon_time: null,
      evening_time: null,
    });
    setModalOpen(true);
  };

  const openEdit = (day, schedule) => {
    setEditingDay({ day, schedule });
    form.setFieldsValue({
      active_slots: schedule.active_slots || [],
      morning_time: schedule.morning_time
        ? dayjs(schedule.morning_time, "HH:mm")
        : null,
      afternoon_time: schedule.afternoon_time
        ? dayjs(schedule.afternoon_time, "HH:mm")
        : null,
      evening_time: schedule.evening_time
        ? dayjs(schedule.evening_time, "HH:mm")
        : null,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingDay(null);
    form.resetFields();
  };

  // ── Save ────────────────────────────────────────────────────────────────────
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
        branch_id: Number(branchId),
        day_of_week: editingDay.day,
        active_slots: values.active_slots,
        morning_time: values.morning_time
          ? dayjs(values.morning_time).format("HH:mm")
          : null,
        afternoon_time: values.afternoon_time
          ? dayjs(values.afternoon_time).format("HH:mm")
          : null,
        evening_time: values.evening_time
          ? dayjs(values.evening_time).format("HH:mm")
          : null,
      };

      const res = editingDay.schedule
        ? await apiClient.put(
            `${SCHEDULE_BASE}/${editingDay.schedule.id}`,
            payload
          )
        : await apiClient.post(SCHEDULE_BASE, payload);

      if (res.code === 200) {
        toast.success(
          editingDay.schedule ? "Schedule updated" : "Schedule added"
        );
        closeModal();
        fetchSchedules();
      } else if (res.code === 400) {
        toast.error(
          res.message || "This day is already configured for this branch"
        );
      } else {
        toast.error(res.message || "Something went wrong");
      }
    } catch (err) {
      if (err?.response?.status === 400) {
        toast.error(
          err?.response?.data?.message ||
            "This day is already configured for this branch"
        );
      } else {
        handleApiError(err, "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (schedule) => {
    setDeletingId(schedule.id);
    try {
      const res = await apiClient.delete(`${SCHEDULE_BASE}/${schedule.id}`);
      if (res.code === 200) {
        toast.success("Schedule deleted");
        fetchSchedules();
      } else {
        toast.error(res.message || "Failed to delete");
      }
    } catch (err) {
      handleApiError(err, "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Table ───────────────────────────────────────────────────────────────────
  const tableData = DAYS_OF_WEEK.map((day) => ({
    key: day,
    day,
    schedule: scheduleMap[day] || null,
  }));

  const columns = [
    {
      title: "Day",
      key: "day",
      width: 110,
      render: (_, record) => <Text strong>{DAY_LABELS[record.day]}</Text>,
    },
    {
      title: "Time slots",
      key: "slots",
      render: (_, record) => {
        if (!record.schedule) {
          return <Text type="secondary" italic>Not configured</Text>;
        }
        return (
          <Flex wrap="wrap" gap={4}>
            {record.schedule.active_slots.map((slot) => (
              <Tag key={slot} color={SLOT_COLOR[slot]} icon={<ClockCircleOutlined />}>
                {getSlotLabel(slot, record.schedule)}
              </Tag>
            ))}
          </Flex>
        );
      },
    },
    {
      title: "Amallar",
      key: "actions",
      width: 130,
      align: "right",
      render: (_, record) => {
        if (!record.schedule) {
          return (
            <Button
              type="dashed"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => openAdd(record.day)}
            >
              Add
            </Button>
          );
        }
        return (
          <Space>
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(record.day, record.schedule)}
            />
            <Popconfirm
              title="Confirm deletion"
              description="This day's schedule will be deleted."
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(record.schedule)}
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                loading={deletingId === record.schedule.id}
              />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <span>Weekly Schedule</span>
            <Tag color="blue">
              {schedules.length} / 7 kun
            </Tag>
          </Space>
        }
        styles={{ body: { padding: 0 } }}
      >
        {loading ? (
          <Flex justify="center" align="center" style={{ minHeight: 200, padding: 24 }}>
            <Spin />
          </Flex>
        ) : (
          <Table
            columns={columns}
            dataSource={tableData}
            pagination={false}
            size="small"
            rowKey="key"
            rowClassName={(record) =>
              record.schedule ? "" : "ant-table-row-muted"
            }
          />
        )}
      </Card>

      {/* ── Add / Edit Modal ──────────────────────────────────────────────── */}
      <ScheduleModal
        open={modalOpen}
        editingDay={editingDay}
        form={form}
        saving={saving}
        onCancel={closeModal}
        onSave={handleSave}
      />
    </>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// SCHEDULE MODAL
// ═════════════════════════════════════════════════════════════════════════════

const ScheduleModal = ({ open, editingDay, form, saving, onCancel, onSave }) => {
  const selectedSlots = Form.useWatch("active_slots", form) || [];

  return (
    <Modal
      title={
        editingDay
          ? `${DAY_LABELS[editingDay.day]} — ${editingDay.schedule ? "Edit Schedule" : "Add Schedule"}`
          : "Schedule"
      }
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="save" type="primary" loading={saving} onClick={onSave}>
          Save
        </Button>,
      ]}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item label="Day">
          <Text strong>{editingDay ? DAY_LABELS[editingDay.day] : ""}</Text>
        </Form.Item>

        <Form.Item
          name="active_slots"
          label="Active slots"
          rules={[
            {
              validator: (_, val) =>
                val && val.length > 0
                  ? Promise.resolve()
                  : Promise.reject(new Error("At least one slot must be selected")),
            },
          ]}
        >
          <Checkbox.Group style={{ width: "100%" }}>
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              {SLOT_OPTIONS.map((slot) => (
                <Checkbox key={slot.value} value={slot.value}>
                  <Tag color={slot.color} style={{ marginLeft: 4 }}>
                    {slot.label}
                  </Tag>
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        </Form.Item>

        {selectedSlots.length > 0 && (
          <>
            <div style={{ borderTop: "1px solid #f0f0f0", margin: "8px 0" }} />
            <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
              Enter time for each active slot (optional)
            </Text>
            <Row gutter={12}>
              {SLOT_OPTIONS.filter((s) => selectedSlots.includes(s.value)).map((slot) => (
                <Col span={24} key={slot.value}>
                  <Form.Item
                    name={`${slot.value}_time`}
                    label={
                      <Space size={4}>
                        <Tag color={slot.color} style={{ margin: 0 }}>
                          {slot.label}
                        </Tag>
                        <Text type="secondary">time</Text>
                      </Space>
                    }
                  >
                    <TimePicker
                      format="HH:mm"
                      placeholder={SLOT_DEFAULT_TIME[slot.value]}
                      style={{ width: "100%" }}
                      minuteStep={5}
                    />
                  </Form.Item>
                </Col>
              ))}
            </Row>
          </>
        )}
      </Form>
    </Modal>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// HOLIDAY SECTION
// ═════════════════════════════════════════════════════════════════════════════

const HolidaySection = ({ branchId }) => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form] = Form.useForm();

  const today = dayjs().startOf("day");

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(
        `${HOLIDAY_BASE}?branch_id=${branchId}`
      );
      if (res.code === 200) {
        setHolidays(res.data || []);
      } else {
        toast.error(res.message || "Failed to load holidays");
      }
    } catch (err) {
      handleApiError(err, "Failed to load holidays");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingHoliday(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (holiday) => {
    setEditingHoliday(holiday);
    form.setFieldsValue({
      holiday_date: dayjs(holiday.holiday_date, "YYYY-MM-DD"),
      reason: holiday.reason || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingHoliday(null);
    form.resetFields();
  };

  // ── Save ────────────────────────────────────────────────────────────────────
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
        branch_id: Number(branchId),
        holiday_date: dayjs(values.holiday_date).format("YYYY-MM-DD"),
        ...(values.reason ? { reason: values.reason } : {}),
      };

      const res = editingHoliday
        ? await apiClient.put(`${HOLIDAY_BASE}/${editingHoliday.id}`, payload)
        : await apiClient.post(HOLIDAY_BASE, payload);

      if (res.code === 200) {
        toast.success(
          editingHoliday ? "Holiday updated" : "Holiday added"
        );
        closeModal();
        fetchHolidays();
      } else if (res.code === 400) {
        toast.error(
          res.message || "This date is already configured for this branch"
        );
      } else {
        toast.error(res.message || "Something went wrong");
      }
    } catch (err) {
      if (err?.response?.status === 400) {
        toast.error(
          err?.response?.data?.message ||
            "This date is already configured for this branch"
        );
      } else {
        handleApiError(err, "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (holiday) => {
    setDeletingId(holiday.id);
    try {
      const res = await apiClient.delete(`${HOLIDAY_BASE}/${holiday.id}`);
      if (res.code === 200) {
        toast.success("Holiday deleted");
        fetchHolidays();
      } else {
        toast.error(res.message || "Failed to delete");
      }
    } catch (err) {
      handleApiError(err, "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Table ───────────────────────────────────────────────────────────────────
  const columns = [
    {
      title: "Date",
      dataIndex: "holiday_date",
      key: "holiday_date",
      render: (date) => {
        const d = dayjs(date, "YYYY-MM-DD");
        const isPast = d.isBefore(today);
        const dayName = d.format("dddd");
        const formatted = d.format("DD MMM YYYY");
        return (
          <Text style={isPast ? { color: "#bfbfbf" } : {}}>
            {formatted}{" "}
            <Text type="secondary" style={isPast ? { color: "#bfbfbf" } : {}}>
              ({dayName})
            </Text>
          </Text>
        );
      },
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
      render: (reason, record) => {
        const isPast = dayjs(record.holiday_date, "YYYY-MM-DD").isBefore(today);
        if (!reason) {
          return <Text type="secondary">—</Text>;
        }
        return (
          <Text style={isPast ? { color: "#bfbfbf" } : {}}>{reason}</Text>
        );
      },
    },
    {
      title: "",
      key: "actions",
      width: 90,
      align: "right",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          />
          <Popconfirm
            title="Confirm deletion"
            description="This holiday will be deleted."
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record)}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={deletingId === record.id}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <span>Holidays</span>
            {holidays.length > 0 && (
              <Tag color="orange">
                {holidays.filter(h => !dayjs(h.holiday_date, "YYYY-MM-DD").isBefore(today)).length} upcoming
              </Tag>
            )}
          </Space>
        }
        extra={
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={openAdd}
          >
            Add Holiday
          </Button>
        }
        styles={{ body: { padding: 0 } }}
      >
        {loading ? (
          <Flex justify="center" align="center" style={{ minHeight: 200, padding: 24 }}>
            <Spin />
          </Flex>
        ) : holidays.length === 0 ? (
          <Flex justify="center" align="center" style={{ minHeight: 150, padding: 24 }}>
            <Empty description="No holidays" />
          </Flex>
        ) : (
          <Table
            columns={columns}
            dataSource={holidays}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 8, position: ["bottomCenter"] }}
            rowClassName={(record) =>
              dayjs(record.holiday_date, "YYYY-MM-DD").isBefore(today)
                ? "past-holiday-row"
                : ""
            }
          />
        )}
      </Card>

      {/* ── Add / Edit Modal ──────────────────────────────────────────────── */}
      <Modal
        title={editingHoliday ? "Edit Holiday" : "Add Holiday"}
        open={modalOpen}
        onCancel={closeModal}
        footer={[
          <Button key="cancel" onClick={closeModal}>
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={saving}
            onClick={handleSave}
          >
            Save
          </Button>,
        ]}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="holiday_date"
            label="Date"
            rules={[{ required: true, message: "Please select a date" }]}
          >
            <DatePicker
              style={{ width: "100%" }}
              format="DD MMM YYYY"
              placeholder="Select date"
            />
          </Form.Item>
          <Form.Item name="reason" label="Reason (optional)">
            <Input placeholder="e.g. National holiday" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default BranchDetails;
