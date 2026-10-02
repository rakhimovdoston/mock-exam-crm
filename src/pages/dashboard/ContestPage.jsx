import React, { useMemo, useState } from "react";
import {
  Table,
  Tag,
  Space,
  Select,
  DatePicker,
  Button,
  Flex,
  Tooltip,
} from "antd";
import { FieldTimeOutlined, RedoOutlined } from "@ant-design/icons";
import useApiRequest from "../../hooks/useApiRequest";
import StatusCounts from "./components/StatusCounts";
import dayjs from "dayjs";
import { Link, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { checkRole } from "../../utils/roleUtils";
import { Role } from "../../data/role";
import { useT } from "../../i18n/useT";
import ExtraTimeModal from "../../components/modal/ExtraTimeModal";
import SectionReopenModal from "../../components/modal/SectionReopenModal";

const { Option } = Select;

/** Rows may carry a date in any readable form; the API wants YYYY-MM-DD. */
const toApiDate = (value) => {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : null;
};

const ContestPage = () => {
  const t = useT();
  // The dashboard links here with a day and a status already chosen, so the
  // list opens on exactly the figures the tile was counting.
  const [searchParams] = useSearchParams();

  const [selectBranch, setSelectBranch] = useState();
  const [testTime, setTestTime] = useState("all");
  const [startDate, setStartDate] = useState(
    () => searchParams.get("date") || dayjs().format("YYYY-MM-DD")
  );
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const { user } = useSelector((state) => state.auth);
  const [statuses, setStatuses] = useState(() => {
    const status = searchParams.get("status");
    return status ? status.split(",") : undefined;
  });
  // The row a grant is being written for; null while the modal is closed.
  const [extraTimeFor, setExtraTimeFor] = useState(null);
  // Likewise for a reopen. Kept apart so one modal closing cannot clear the
  // other's row out from under it.
  const [reopenFor, setReopenFor] = useState(null);
  // Both actions carry the same permission: a branch admin may run either one
  // for their own branch, and the backend refuses anyone else.
  const canManageExam =
    checkRole(user.roles, Role.ROLE_ADMIN) ||
    checkRole(user.roles, Role.ROLE_BRANCH_ADMIN);

  const demo = searchParams.get("demo") === "1";

  // Counted the same way the speaking page counts: the list endpoint reports a
  // total, so one row per status is enough to read it. Same date, branch and
  // shift as the table, so the tiles always describe what is below them.
  const countUrl = useMemo(
    () => (value) => {
      const params = new URLSearchParams();
      params.set("page", 0);
      params.set("size", 1);
      params.set("status", value);
      if (selectBranch) params.set("branch", selectBranch);
      if (testTime !== "all") params.set("time", testTime);
      if (startDate) params.set("date", startDate);
      return `api/v1/booking/all?${params.toString()}`;
    },
    [selectBranch, testTime, startDate]
  );

  const statusTiles = useMemo(
    () => [
      { value: "WAITING", label: t("contest.waiting") },
      { value: "PROCESS", label: t("contest.inProgress") },
      { value: "COMPLETED", label: t("contest.completed") },
      { value: "FAILED", label: t("contest.failed"), tone: "danger" },
    ],
    [t]
  );

  // Tiles narrow the table instead of navigating: the route they would link to
  // is the one already open, and nothing would happen.
  const handleSelectStatus = (next) => {
    setStatuses(next);
    setPage(0);
  };

  const columns = [
    {
      title: "№",
      dataIndex: "index",
      key: "index",
      render: (text, record, index) => index + 1 + page * size,
    },
    {
      title: t("table.student"),
      dataIndex: "studentName",
      key: "studentName",
    },
    {
      title: t("table.phone"),
      dataIndex: "phoneNumber",
      key: "phoneNumber",
    },
    {
      title: t("table.branch"),
      dataIndex: "branch",
      key: "branch",
    },
    {
      title: t("table.testDate"),
      dataIndex: "testDate",
      key: "testDate",
    },
    {
      title: t("table.testShift"),
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
      title: t("common.status"),
      dataIndex: "status",
      key: "status",
      filters: [
        { text: t("contest.waiting"), value: "WAITING" },
        { text: t("contest.inProgress"), value: "PROCESS" },
        { text: t("contest.completed"), value: "COMPLETED" },
        { text: t("contest.failed"), value: "FAILED" },
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
        const labels = {
          WAITING: t("contest.waiting"),
          PROCESS: t("contest.inProgress"),
          COMPLETED: t("contest.completed"),
          FAILED: t("contest.failed"),
        };
        return <Tag color={color}>{labels[status] || status}</Tag>;
      },
    },
    {
      title: t("contest.payment"),
      dataIndex: "payment",
      key: "payment",
      render: (payment) => {
        const isPayed = payment === "PAID";
        const color = isPayed
          ? "green"
          : payment === "PENDING"
          ? "yellow"
          : "red";
        return (
          <Tag color={color}>
            {isPayed
              ? t("contest.paid")
              : payment === "PENDING"
              ? t("contest.processing")
              : t("contest.notPaid")}
          </Tag>
        );
      },
    },
    {
      title: "",
      key: "actions",
      render: (_, record) => {
        // A row knows who the student is, the day and the session — which is
        // exactly how the student endpoint addresses an exam. Sending the shift
        // from here is what keeps the "several sessions" refusal unreachable.
        const userId =
          record.userId ??
          record.user_id ??
          record.studentId ??
          record.student_id;
        // Only used where a row has no student id to offer.
        const examId = record.examId ?? record.exam_id;

        const target = userId
          ? {
              userId,
              // The list is already filtered to one day, so the filter stands in
              // when a row carries no date of its own.
              date: toApiDate(record.testDate) || startDate,
              testTime: record.time,
            }
          : examId
          ? { examId }
          : null;

        return (
          <Flex justify="center" align="center" gap={12}>
            {canManageExam && target && (
              <Tooltip title={t("extraTime.singleAction")}>
                <Button
                  aria-label={t("extraTime.singleAction")}
                  icon={<FieldTimeOutlined />}
                  onClick={() =>
                    setExtraTimeFor({ target, studentName: record.studentName })
                  }
                />
              </Tooltip>
            )}
            {canManageExam && target && (
              <Tooltip title={t("sectionReopen.singleAction")}>
                <Button
                  aria-label={t("sectionReopen.singleAction")}
                  icon={<RedoOutlined />}
                  onClick={() =>
                    setReopenFor({ target, studentName: record.studentName })
                  }
                />
              </Tooltip>
            )}
            <Button type="primary" style={{ cursor: "pointer" }}>
              <Link
                to={`${record.id}/${record.type}`}
                style={{ cursor: "pointer", color: "white" }}
              >
                {t("contest.details")}
              </Link>
            </Button>
          </Flex>
        );
      },
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
      <h2>📋 {t("contest.upcomingTitle")}</h2>

      <div style={{ marginBottom: 24 }}>
        <StatusCounts
          statuses={statusTiles}
          buildUrl={countUrl}
          selected={statuses}
          onSelect={handleSelectStatus}
          examples={
            demo
              ? { WAITING: 5, PROCESS: 7, COMPLETED: 18, FAILED: 5 }
              : undefined
          }
        />
      </div>

      <Space style={{ marginBottom: 16 }}>
        {checkRole(user.roles, Role.ROLE_ADMIN) && (
          <Select
            placeholder={t("contest.selectBranch")}
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
          placeholder={t("contest.timeSlot")}
          style={{ width: 300 }}
          defaultValue={testTime}
          onChange={(value) => setTestTime(value)}
        >
          <Option key={"all"}>{t("common.all")}</Option>
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

      <ExtraTimeModal
        open={Boolean(extraTimeFor)}
        onClose={() => setExtraTimeFor(null)}
        target={extraTimeFor?.target}
        studentName={extraTimeFor?.studentName}
      />

      <SectionReopenModal
        open={Boolean(reopenFor)}
        onClose={() => setReopenFor(null)}
        target={reopenFor?.target}
        studentName={reopenFor?.studentName}
      />
    </div>
  );
};

export default ContestPage;
