import { Card, Col, Row, Spin, Statistic, Typography } from "antd";
import React from "react";
import CountUp from "react-countup";
import useApiRequest from "../../hooks/useApiRequest";
import UserSignupStats from "./UserSignupStats";
import BookingStatMonth from "./BookingStatMonth";
import { useT } from "../../i18n/useT";

const formatter = (value) => <CountUp end={value} separator="," />;

const DashboardPage = () => {
  const t = useT();
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
      <Typography.Title level={2}>{t("dashboard.materials")}</Typography.Title>
      <Row gutter={[8, 8]}>
        <Col span={8}>
          <Card>
            <Statistic
              title={t("dashboard.allReading")}
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
              title={t("dashboard.allWriting")}
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
              title={t("dashboard.allListening")}
              value={data?.data?.totalListening}
              precision={2}
              formatter={formatter}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
      </Row>
      <Typography.Title level={2}>
        {t("dashboard.allUsers")}{" "}
        <span
          style={{
            color: "#3f8600",
          }}
        >
          (<CountUp end={data?.data?.totalUsers} separator="," />)
        </span>
      </Typography.Title>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card variant="outlined">
            <Statistic
              title={t("dashboard.everester")}
              value={data?.data?.everester}
              formatter={formatter}
              valueStyle={{ color: "#3f8600" }}
              precision={2}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card variant="outlined">
            <Statistic
              title={t("dashboard.nonEverester")}
              value={data?.data?.nonEverester}
              formatter={formatter}
              valueStyle={{ color: "#cf1322" }}
              precision={2}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card variant="outlined">
            <Statistic
              title={t("dashboard.onlineRegister")}
              value={data?.data?.onlineRegister}
              formatter={formatter}
              valueStyle={{ color: "#1677ff" }}
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
