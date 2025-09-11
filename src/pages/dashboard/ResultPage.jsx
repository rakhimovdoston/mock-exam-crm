import React, { useState } from "react";
import useApiRequest from "../../hooks/useApiRequest";
import {
  Button,
  DatePicker,
  Dropdown,
  Flex,
  Table,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import apiClient from "../../services/api";
import { toast } from "react-toastify";

const ResultPage = () => {
  const [date, setDate] = useState(dayjs());
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const { data, loading } = useApiRequest(
    `api/v1/admin/user/history?date=${date.format("YYYY-MM-DD")}&page=${
      pagination.current - 1
    }&size=${pagination.pageSize}`,
    [date, pagination.current, pagination.pageSize]
  );
  const [exportLoading, setExportLoading] = useState(false);
  const columns = [
    {
      title: "№",
      dataIndex: "index",
      key: "index",
      render: (text, record, index) =>
        index + 1 + (pagination.current - 1) * pagination.pageSize,
    },
    {
      title: "Candidate Name",
      dataIndex: "fullName",
      key: "fullName",
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "COMPLETED" ? "green" : "orange"}>{status}</Tag>
      ),
    },
    {
      title: "Branch",
      dataIndex: "branchName",
      key: "branchName",
    },
    {
      title: "Listening",
      children: [
        {
          title: "Count",
          dataIndex: "listeningCount",
          key: "listeningCount",
        },
        {
          title: "Score",
          dataIndex: "listeningScore",
          key: "listeningScore",
        },
      ],
      onHeaderCell: () => {
        return {
          style: {
            backgroundColor: "#e6f7ff", // moviy fon
            color: "#000", // matn rangi
            fontWeight: "bold", // qalin yozuv
          },
        };
      },
    },
    {
      title: "Reading",
      children: [
        {
          title: "Count",
          dataIndex: "readingCount",
          key: "readingCount",
        },
        {
          title: "Score",
          dataIndex: "readingScore",
          key: "readingScore",
        },
      ],
      onHeaderCell: () => {
        return {
          style: {
            backgroundColor: "#e6f7ff", // moviy fon
            color: "#000", // matn rangi
            fontWeight: "bold", // qalin yozuv
          },
        };
      },
    },
    {
      title: "Writing",
      children: [
        {
          title: "Task 1",
          dataIndex: "taskOneScore",
          key: "taskOneScore",
        },
        {
          title: "Task 2",
          dataIndex: "taskTwoScore",
          key: "taskTwoScore",
        },
        {
          title: `Writing \n Overall`,
          dataIndex: "writingScore",
          key: "writingScore",
        },
      ],
      onHeaderCell: () => {
        return {
          style: {
            backgroundColor: "#e6f7ff", // moviy fon
            color: "#000", // matn rangi
            fontWeight: "bold", // qalin yozuv
          },
        };
      },
    },
    {
      title: "Speaking",
      dataIndex: "speakingScore",
      key: "speakingScore",
    },
    {
      title: "Overall",
      dataIndex: "overall",
      key: "overall",
    },
    {
      title: "",
      dataIndex: "note",
      render: (_, record) => (
        <Link to={`/dashboard/contest/${record.bookingId}/TEST`}>
          <Button>View</Button>
        </Link>
      ),
    },
  ];

  const exportHistory = async (type) => {
    setExportLoading(true);
    try {
      const response = await apiClient.post(
        `api/v1/admin/user/export/pdf?date=${date.format(
          "YYYY-MM-DD"
        )}&type=${type}`,
        {},
        { responseType: "arraybuffer" }
      );
      if (!response) {
        toast.error("This date is not any exam!");
        return;
      }
      const blob = new Blob([response], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      if (type === "pdf") {
        window.open(url, "_blank");
        return;
      }
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `history-${date.format("YYYY-MM-DD")}.${
          type === "pdf" ? "pdf" : "xlsx"
        }`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Error exporting history:", error);
    } finally {
      setExportLoading(false);
    }
  };
  const handleTableChange = (page, pageSize) => {
    setPagination({
      current: page,
      pageSize: pageSize,
    });
  };

  const menuItems = [
    {
      key: "1",
      label: "Export PDF",
      onClick: () => exportHistory("pdf"),
    },
    {
      key: "2",
      label: "Export Excel",
      onClick: () => exportHistory("excel"),
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          gap: 8,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <b>Select Date:</b>
          <DatePicker
            style={{ width: "150px" }}
            value={date}
            onChange={(val) => setDate(val || dayjs())}
          />
        </div>
        <Dropdown
          trigger={["click"]}
          menu={{
            items: menuItems,
          }}
        >
          <Button type="primary" icon={"📤"} loading={exportLoading}>
            Export
          </Button>
        </Dropdown>
      </div>
      <Table
        size="small"
        title={() => (
          <Flex justify="center" gap={10} align="center">
            <Typography.Title level={3} style={{ margin: 0 }}>
              Test results on the
            </Typography.Title>
            <Typography.Title level={4} style={{ margin: 0, color: "#1890ff" }}>
              {date.format("DD MMMM YYYY, (dddd)  ")}
            </Typography.Title>
          </Flex>
        )}
        footer={() => <></>}
        bordered
        dataSource={data?.data?.data || []}
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: data?.data?.totalSizes || 0,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          showQuickJumper: true,
          onChange: handleTableChange,
        }}
        rowKey="id"
        columns={columns}
      />
    </div>
  );
};

export default ResultPage;
