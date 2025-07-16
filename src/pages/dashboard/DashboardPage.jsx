import React from "react";
import { Card, Col, Row, Statistic, Spin } from "antd";
import CountUp from "react-countup";
import useApiRequest from "../../hooks/useApiRequest";

const formatter = (value) => <CountUp end={value} separator="," />;

const stats = [
  { title: "Active Users", key: "totalUsers", color: "#3f8600" },
  { title: "All Reading", key: "totalReading", color: "#1890ff" },
  { title: "All Writing", key: "totalWriting", color: "#eb2f96" },
  { title: "All Listening", key: "totalListening", color: "#faad14" },
];

const DashboardPage = () => {
  const { data, loading } = useApiRequest("api/v1/dashboard/all");

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 20, margin: "0 auto" }}>
      <Row gutter={[24, 24]}>
        {stats.map(({ title, key, color }) => (
          <Col xs={24} sm={12} md={12} lg={6} key={key}>
            <Card
              hoverable
              style={{
                borderRadius: 12,
                boxShadow: "0 6px 12px rgba(0,0,0,0.1)",
                transition: "box-shadow 0.3s ease",
              }}
              bodyStyle={{ padding: 24, textAlign: "center" }}
            >
              <Statistic
                title={
                  <span style={{ fontWeight: "600", fontSize: 16 }}>
                    {title}
                  </span>
                }
                value={data?.data?.[key] || 0}
                formatter={formatter}
                valueStyle={{
                  color,
                  fontWeight: "700",
                  fontSize: 32,
                  marginTop: 12,
                }}
                precision={0}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default DashboardPage;
