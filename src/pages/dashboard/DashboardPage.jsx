import { Card, Col, Row, Spin, Statistic } from "antd";
import React from "react";
import CountUp from "react-countup";
import useApiRequest from "../../hooks/useApiRequest";

const formatter = (value) => <CountUp end={value} separator="," />;

const DashboardPage = () => {
  const { data, loading } = useApiRequest("api/v1/dashboard/all");

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card variant="borderless">
            <Statistic
              title="Active Users"
              value={data?.data?.totalUsers}
              formatter={formatter}
              valueStyle={{ color: "#3f8600" }}
              precision={2}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card variant="borderless">
            <Statistic
              title="All Reading"
              value={data?.data?.totalReading}
              precision={2}
              formatter={formatter}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card variant="borderless">
            <Statistic
              title="All Writing"
              value={data?.data?.totalWriting}
              precision={2}
              formatter={formatter}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card variant="borderless">
            <Statistic
              title="All Listening"
              value={data?.data?.totalListening}
              precision={2}
              formatter={formatter}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
