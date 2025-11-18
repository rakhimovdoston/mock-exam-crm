import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Card,
  Col,
  DatePicker,
  Empty,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import useApiRequest from "../hooks/useApiRequest";
import { useSelector } from "react-redux";

const { Title, Text } = Typography;

const TestDates = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const { user } = useSelector((state) => state.auth);
  const [selectedBranch, setSelectedBranch] = useState(
    () => user?.branchId || undefined
  );
  const formattedDate = useMemo(
    () => selectedDate?.format("YYYY-MM-DD") || "",
    [selectedDate]
  );
  const branchQuery = selectedBranch || user?.branchId || "";

  useEffect(() => {
    if (!selectedBranch && user?.branchId) {
      setSelectedBranch(user.branchId);
    }
  }, [selectedBranch, user?.branchId]);

  const { data, loading, error } = useApiRequest(
    `api/v1/test-session/check-available?date=${formattedDate}&branch=${branchQuery}`,
    [formattedDate, branchQuery]
  );
  const {
    data: branchData,
    loading: branchLoading,
    error: branchError,
  } = useApiRequest("api/v1/branch/all");

  const apiError = !loading && (error || data?.code !== 200);
  const testDates = data?.code === 200 ? data?.data || [] : [];
  const branchOptions = branchData?.data?.branches || [];

  useEffect(() => {
    if (!selectedBranch && branchOptions.length) {
      setSelectedBranch(branchOptions[0]?.id);
    }
  }, [branchOptions, selectedBranch]);

  const handleDateChange = (value) => {
    setSelectedDate(value || dayjs());
  };

  const handleBranchChange = (value) => {
    setSelectedBranch(value || undefined);
  };

  const renderContent = () => {
    if (!branchQuery) {
      return (
        <Alert
          type="info"
          showIcon
          message="Select a branch"
          description="Choose a branch to view its available test sessions."
        />
      );
    }

    if (loading) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "200px",
          }}
        >
          <Spin tip="Loading test dates..." size="large" />
        </div>
      );
    }

    if (apiError) {
      return (
        <Alert
          type="error"
          showIcon
          message="Failed to load test dates"
          description={
            error?.message || data?.message || "Please try again later."
          }
        />
      );
    }

    if (!testDates.length) {
      return <Empty description="No test sessions found for this date" />;
    }

    return (
      <Row gutter={[16, 16]}>
        {testDates.map((session) => (
          <Col key={session.id} xs={24} sm={12} md={8} lg={6} xl={6} xxl={6}>
            <Card
              hoverable
              style={{ borderRadius: 20, borderColor: "#e5e5e5" }}
              bodyStyle={{
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                  flexWrap: "wrap",
                  paddingBottom: 12,
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <Text
                  strong
                  style={{ fontSize: 16, textTransform: "uppercase" }}
                >
                  {session.branchName}
                </Text>
                <Tag
                  color="blue"
                  style={{
                    margin: 0,
                    padding: "4px 14px",
                    borderRadius: 16,
                    fontWeight: 600,
                    fontSize: 13,
                    background: "#F0F7FF",
                    border: "1px solid #d0e7ff",
                    color: "#1677ff",
                  }}
                >
                  {dayjs(session.date).format("YYYY-MM-DD")}
                </Tag>
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <Text>
                  <Text strong>Day of Week:</Text>{" "}
                  {session.dayOfWeek?.toUpperCase?.() || session.dayOfWeek}
                </Text>
                <Text>
                  <Text strong>Test Slot:</Text> {session.time}
                </Text>
                <Text>
                  <Text strong>Test Time:</Text>{" "}
                  <Tag color="blue">{session.timeString}</Tag>
                </Text>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Text strong>Status:</Text>
                  <Tag
                    color="green"
                    style={{
                      background: "#EAF7E6",
                      color: "#2f7a12",
                      border: "1px solid #cbe5c0",
                      borderRadius: 14,
                      padding: "2px 14px",
                      fontWeight: 600,
                    }}
                  >
                    {session.existedSpace} Available
                  </Tag>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Test Dates
          </Title>
          <Text type="secondary">
            View every available slot directly from the API response.
          </Text>
        </div>
        <Space size={12} wrap>
          <Space direction="vertical" size={4}>
            <Text strong>Select date</Text>
            <DatePicker
              allowClear={false}
              value={selectedDate}
              onChange={handleDateChange}
              format="YYYY-MM-DD"
            />
          </Space>
          <Space direction="vertical" size={4}>
            <Text strong>Select branch</Text>
            <Select
              showSearch
              allowClear
              placeholder={
                branchLoading ? "Loading branches..." : "Select branch"
              }
              optionFilterProp="children"
              style={{ minWidth: 220 }}
              loading={branchLoading}
              value={selectedBranch}
              onChange={handleBranchChange}
              status={branchError ? "error" : undefined}
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={branchOptions.map((branch) => ({
                label: branch.name,
                value: branch.id,
              }))}
            />
          </Space>
        </Space>
      </div>

      {renderContent()}
    </div>
  );
};

export default TestDates;
