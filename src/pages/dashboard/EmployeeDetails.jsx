import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useApiRequest from "../../hooks/useApiRequest";
import {
  Button,
  Card,
  Checkbox,
  Descriptions,
  Popconfirm,
  Spin,
  Switch,
  Tag,
  TimePicker,
} from "antd";
import apiClient from "../../services/api";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { checkRole } from "../../utils/roleUtils";
import { Role } from "../../data/role";

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

  useEffect(() => {
    if (data?.data) {
      setRoles(data.data.roles || []);
      setActive(data.data.active || false);
    }
  }, [data]);

  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [adding, setAdding] = useState(false);
  const [addingLoading, setAddingLoading] = useState(false);

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

  const checkIsThatRole = (role) => roles.includes(role);
  const handleRoleChange = (checkedValues) => {
    setRoles(checkedValues);
  };

  const handleStatusChange = (checked) => {
    setActive(checked);
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await apiClient.put(`api/v1/admin/user/roles/update/${data.data.id}`, {
        roles,
        active,
      });
      message.success("Updated successfully");
      refresh();
    } catch (err) {
      message.error("Failed to update");
    } finally {
      setUpdating(false);
    }
  };

  const workHoursAdd = async () => {
    setAddingLoading(true);
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
      setAddingLoading(false);
    }
  };

  const handleDeleteWorkTime = async (id) => {
    try {
      const response = await apiClient.delete(
        `api/v1/speaking/delete/word-time/${id}`
      );

      if (response.code != 200) {
        toast.warn(response.message || "Work time not deleted!");
        return;
      }
      setRefresh((prev) => prev + 1);
    } catch (err) {
      toast.error("Failed something!");
    } finally {
      setAddingLoading(false);
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
              <Checkbox value="ROLE_BRANCH_ADMIN">Branch Admin</Checkbox>
              <Checkbox value="ROLE_SPEAKER">Speaker</Checkbox>
            </Checkbox.Group>
          </Descriptions.Item>

          <Descriptions.Item label="Everester">
            {data?.data.everester ? "Yes" : "No"}
          </Descriptions.Item>

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
      {checkRole(roles, Role.ROLE_SPEAKER) && (
        <Card
          title="Work Times"
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
      )}
    </>
  );
};

export default EmployeeDetails;
