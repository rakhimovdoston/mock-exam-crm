import React, { useMemo, useState } from "react";
import { Table, Tag, Space, Select, DatePicker, Button, Flex } from "antd";
import useApiRequest from "../../hooks/useApiRequest";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { checkRole } from "../../utils/roleUtils";
import { Role } from "../../data/role";

const { Option } = Select;

const ContestPage = () => {
  const [selectBranch, setSelectBranch] = useState();
  const [testTime, setTestTime] = useState("all");
  const [startDate, setStartDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const { user } = useSelector((state) => state.auth);
  const [statuses, setStatuses] = useState();

  const columns = [
    {
      title: "№",
      dataIndex: "index",
      key: "index",
      render: (text, record, index) => index + 1 + page * size,
    },
    {
      title: "Student",
      dataIndex: "studentName",
      key: "studentName",
    },
    {
      title: "Phone number",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
    },
    {
      title: "Branch",
      dataIndex: "branch",
      key: "branch",
    },
    {
      title: "Test Date",
      dataIndex: "testDate",
      key: "testDate",
    },
    {
      title: "Test Shift",
      dataIndex: "time",
      key: "time",
      render: (time) => {
        const emoji =
          time === "morning"
            ? "☀️ "
            : time === "afternoon"
            ? "🌤 "
            : time === "evening"
            ? "🌙 "
            : "🕒 ";
        return `${emoji} ${time}`;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "blue";
        if (status === "COMPELETED") color = "green";
        else if (status === "PROCESS") color = "orange";
        else if (status === "IN_COMPLED") color = "gray";
        else if (status === "FAILED") color = "red";
        return <Tag color={color}>{status === 'PROCESS' ? "In Progress" : status}</Tag>;
      },
      filters: [
        { text: "Waiting", value: "WAITING" },
        { text: "In Progress", value: "PROCESS" },
        { text: "Completed", value: "COMPLETED" },
        { text: "Failed", value: "FAILED" },
      ],
      filterMultiple: true,
      filteredValue:
        Array.isArray(statuses) && statuses.length ? statuses : null, // controlled UI state
      render: (status) => {
        let color = "blue";
        if (status === "COMPLETED") color = "green";
        else if (status === "PROCESS") color = "orange";
        else if (status === "WAITING") color = "geekblue";
        else if (status === "FAILED") color = "red";
        return <Tag color={color}>{status === 'PROCESS' ? "In Progress" : status}</Tag>;
      },
    },
    {
      title: "",
      key: "actions",
      render: (_, record) => (
        <Flex justify="center" align="center" gap={12}>
          <Button type="primary" style={{ cursor: "pointer" }}>
            <Link
              to={`${record.id}/${record.type}`}
              style={{ cursor: "pointer", color: "white" }}
            >
              Details
            </Link>
          </Button>
        </Flex>
      ),
    },
  ];

  const handleTableChange = (pagination, filters /*, sorter*/) => {
    setPage((pagination.current || 1) - 1);
    setSize(pagination.pageSize || 10);

    // filters.status is an array of selected values (we'll use the first)
    const nextStatus = Array.isArray(filters?.status) ? filters.status : [];
    setStatuses(nextStatus); // triggers URL rebuild -> refetch
  };

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("size", size);
    if (selectBranch) params.set("branch", selectBranch);
    if (testTime !== "all") params.set("time", testTime);
    if (startDate) params.set("date", startDate);
    console.log("Status: ", statuses);
    if (statuses && statuses.length > 0)
      params.set("status", statuses.join(","));
    return `api/v1/booking/all?${params.toString()}`;
  }, [page, size, selectBranch, testTime, startDate, statuses]);

  const { data, loading } = useApiRequest(apiUrl, [apiUrl]);

  const branches = useApiRequest(`api/v1/branch/all`);

  return (
    <div>
      <h2>📋 Upcoming Test sessions</h2>
      <Space style={{ marginBottom: 16 }}>
        {checkRole(user.roles, Role.ROLE_ADMIN) && (
          <Select
            placeholder="Select branch"
            style={{ width: 300 }}
            onChange={(value) => setSelectBranch(value)}
          >
            {branches.data?.data?.branches?.map((branch) => (
              <Option key={branch.id} value={branch.id}>
                {branch.name}
              </Option>
            ))}
          </Select>
        )}
        <DatePicker
          style={{ width: "150px" }}
          value={dayjs(startDate, "YYYY-MM-DD")}
          onChange={(date) => {
            if (date) setStartDate(dayjs(date).format("YYYY-MM-DD"));
            else setStartDate(dayjs().format("YYYY-MM-DD"));
          }}
        />
        <Select
          placeholder={"Time slot"}
          style={{ width: 300 }}
          defaultValue={testTime}
          onChange={(value) => setTestTime(value)}
        >
          <Option key={"all"}>All</Option>
          {branches?.data?.data?.testTimes?.map((time) => (
            <Option key={time}>
              {time.charAt(0).toUpperCase() + time.slice(1)}
            </Option>
          ))}
        </Select>
      </Space>

      <Table
        columns={columns}
        loading={loading}
        dataSource={
          data?.code === 200 && data?.data?.data
            ? data?.data.data.map((item, index) => ({ ...item, key: index }))
            : []
        }
        pagination={{
          current: page + 1,
          pageSize: size,
          total: data?.data?.totalSizes,
          onChange: (page, size) => {
            setPage(page - 1);
            setSize(size);
          },
        }}
        onChange={handleTableChange}
      />
    </div>
  );
};

export default ContestPage;
