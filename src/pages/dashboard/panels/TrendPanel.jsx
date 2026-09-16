import React, { useMemo } from "react";
import { Alert, Col, Row, Space } from "antd";
import ChartCard from "../components/ChartCard";
import StatTile from "../components/StatTile";
import { BandChart, SeriesChart } from "../components/DashboardCharts";
import { PanelError } from "../components/PanelState";
import { bandPoints, formatMonth, growth, trendSeries } from "../dashboardData";
import { useT } from "../../../i18n/useT";

const asBand = (value) => (Number.isFinite(value) ? value.toFixed(1) : "—");

/** Bookings over the last months, against the period before. */
const TrendPanel = ({ data, loading, error, onRetry }) => {
  const t = useT();

  const bookedLabel = t("dashboard.bookings");
  const completedLabel = t("dashboard.completed");

  const points = useMemo(
    () => trendSeries(data?.months, bookedLabel, completedLabel),
    [data?.months, bookedLabel, completedLabel]
  );

  const bands = useMemo(() => bandPoints(data?.months), [data?.months]);

  const tableData = useMemo(
    () =>
      (data?.months || []).map((row) => ({
        ...row,
        key: row.month,
        month: formatMonth(row.month),
      })),
    [data?.months]
  );

  if (error) return <PanelError error={error} onRetry={onRetry} />;

  const current = data?.currentPeriod;
  const previous = data?.previousPeriod;

  // The field is absent, not null, when the backend has no price data at all —
  // so the whole revenue block is simply not built.
  const hasRevenue = current != null && "revenue" in current;

  const tableColumns = [
    { title: t("dashboard.month"), dataIndex: "month", key: "month", fixed: "left" },
    { title: bookedLabel, dataIndex: "bookings", key: "bookings", align: "right" },
    { title: completedLabel, dataIndex: "completed", key: "completed", align: "right" },
    {
      title: t("dashboard.averageBand"),
      dataIndex: "averageBand",
      key: "averageBand",
      align: "right",
      render: asBand,
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={hasRevenue ? 6 : 8}>
          <StatTile
            label={bookedLabel}
            value={current?.bookings}
            growth={growth(current?.bookings, previous?.bookings)}
            growthLabel={t("dashboard.vsPrevPeriod")}
            hint={t("dashboard.noComparison")}
            to="/dashboard/contest"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} xl={hasRevenue ? 6 : 8}>
          <StatTile
            label={completedLabel}
            value={current?.completed}
            growth={growth(current?.completed, previous?.completed)}
            growthLabel={t("dashboard.vsPrevPeriod")}
            hint={t("dashboard.noComparison")}
            to="/dashboard/results"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} xl={hasRevenue ? 6 : 8}>
          <StatTile
            label={t("dashboard.averageBand")}
            value={asBand(current?.averageBand)}
            hint={
              Number.isFinite(previous?.averageBand)
                ? `${t("dashboard.before")}: ${asBand(previous.averageBand)}`
                : t("dashboard.noComparison")
            }
            to="/dashboard/results"
            loading={loading}
          />
        </Col>
        {hasRevenue && (
          <Col xs={24} sm={12} xl={6}>
            <StatTile
              label={t("dashboard.revenue")}
              value={Math.round(current.revenue).toLocaleString()}
              growth={growth(current.revenue, previous?.revenue)}
              growthLabel={t("dashboard.vsPrevPeriod")}
              hint={t("dashboard.onlinePaymentsOnly")}
              loading={loading}
            />
          </Col>
        )}
      </Row>

      {hasRevenue && (
        // Admin-panel bookings carry no payment record, so this is not the
        // centre's takings. Saying so beside the number is cheaper than having
        // a director plan against it.
        <Alert type="info" showIcon message={t("dashboard.revenueCaveat")} />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <ChartCard
            title={t("dashboard.bookingTrend")}
            subtitle={t("dashboard.completedIsSubset")}
            loading={loading}
            isEmpty={!points.some((point) => point.value > 0)}
            tableColumns={tableColumns}
            tableData={tableData}
          >
            <SeriesChart points={points} domain={[bookedLabel, completedLabel]} />
          </ChartCard>
        </Col>

        <Col xs={24} xl={10}>
          <ChartCard
            title={t("dashboard.bandByMonth")}
            subtitle={t("dashboard.unmarkedMonthsBlank")}
            loading={loading}
            isEmpty={!bands.points.length}
          >
            <BandChart points={bands.points} domain={bands.domain} height={270} />
          </ChartCard>
        </Col>
      </Row>
    </Space>
  );
};

export default TrendPanel;
