import { Card, Col, Row, Spin, Statistic, Typography } from "antd";
import React from "react";
import CountUp from "react-countup";
import useApiRequest from "../../hooks/useApiRequest";
import UserSignupStats from "./UserSignupStats";
import BookingStatMonth from "./BookingStatMonth";

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
    <div>
      <Typography.Title level={2}>Materials</Typography.Title>
      <Row gutter={[8, 8]}>
        <Col span={8}>
          <Card>
            <Statistic
              title="All Reading"
              value={data?.data?.totalReading}
              precision={2}
              formatter={formatter}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="All Writing"
              value={data?.data?.totalWriting}
              precision={2}
              formatter={formatter}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
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
      <Typography.Title level={2}>
        All Users{" "}
        <span
          style={{
            color: "#3f8600",
          }}
        >
          (<CountUp end={data?.data?.totalUsers} separator="," />)
        </span>
      </Typography.Title>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card variant="outlined">
            <Statistic
              title="Everester"
              value={data?.data?.everester}
              formatter={formatter}
              valueStyle={{ color: "#3f8600" }}
              precision={2}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card variant="outlined">
            <Statistic
              title="Non Everester"
              value={data?.data?.nonEverester}
              formatter={formatter}
              valueStyle={{ color: "#3f8600" }}
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      <UserSignupStats />

      <BookingStatMonth />
    </div>
  );
};

export default DashboardPage;
