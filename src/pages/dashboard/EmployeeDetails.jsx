import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useApiRequest from "../../hooks/useApiRequest";
import {
  Button,
  Card,
  Checkbox,
  Descriptions,
  Modal,
  Popconfirm,
  Select,
  Spin,
  Switch,
  Tag,
  TimePicker,
} from "antd";
import apiClient from "../../services/api";
import { toast } from "react-toastify";
import dayjs from "dayjs";

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
    setAdding(true);
    const requestBody = {
      startTime: startTime.format("HH:mm"),
      endTime: endTime.format("HH:mm"),
      userId: id,
    };
    try {
      const response = await apiClient.post(
        `api/v1/speaking/record/word-time`,
        requestBody
      );

      if (response.code != 200) {
        toast.warn(response.message || "Work time not saved!");
        return;
      }
      setRefresh((prev) => prev + 1);
    } catch (err) {
      toast.error("Failed something!");
    } finally {
      setAdding(false);
    }
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

export default EmployeeDetails;
