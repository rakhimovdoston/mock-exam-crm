import React, { useState } from "react";
import { Button, DatePicker, Empty, Flex, Table, Typography } from "antd";
import useApiRequest from "../../hooks/useApiRequest";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const { Title } = Typography;

const ContextsPage = () => {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [selectDate, setSelectDate] = useState();
  const navigate = useNavigate();

  const { data, loading } = useApiRequest("");

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Test date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Time",
      dataIndex: "time",
      key: "time",
    },
    {
      title: "",
      key: "actions",
      render: (_, record) => (
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Button onClick={() => navigate(`/dashboard/context/${record.id}`)}>
            View
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Title level={0}>Available Contexts</Title>
      <Flex justify="space-between" align="center" style={{marginBottom: 10}}>
        <DatePicker
          placeholder="Select Date"
          style={{ width: "200px" }}
          value={selectDate ? dayjs(selectDate) : null}
          onChange={(date) =>
            setSelectDate(date ? date.format("YYYY-MM-DD") : "")
          }
        />
        <Button
          type="primary"
          onClick={() => navigate("/dashboard/context/create")}
        >
          New Context
        </Button>
      </Flex>
      <Table
        loading={loading}
        locale={{
          emptyText: (
            <Empty
              style={{ margin: "50px 0" }}
              description="No available Context"
            />
          ),
        }}
        pagination={{
          current: page,
          pageSize: size,
          total: data?.data?.totalSizes || 0,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          showQuickJumper: true,
          onChange: (page) => setPage(page),
        }}
        dataSource={data?.data?.data || []}
        columns={columns}
        rowKey="username"
      />
    </div>
  );
};

export default ContextsPage;
