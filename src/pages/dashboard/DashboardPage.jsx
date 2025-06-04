import { Card, Col, Row, Statistic } from "antd";
import React from "react";
import CountUp from "react-countup";

const formatter = (value) => <CountUp end={value} separator="," />;

const DashboardPage = () => {
  return (
    <div style={{ padding: "20px" }}>
      <Row gutter={16}>
        <Col span={12}>
          <Card variant="borderless">
            <Statistic
              title="Active Users"
              value={12893}
              formatter={formatter}
              valueStyle={{ color: "#3f8600" }}
              precision={2}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card variant="borderless">
            <Statistic
              title="Account Balance"
              value={112893}
              precision={2}
              formatter={formatter}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
