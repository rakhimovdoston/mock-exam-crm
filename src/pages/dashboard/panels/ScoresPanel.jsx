import React, { useMemo } from "react";
import { Card, Col, Row, Table } from "antd";
import ChartCard from "../components/ChartCard";
import StatTile from "../components/StatTile";
import { HistogramChart } from "../components/DashboardCharts";
import { PanelError } from "../components/PanelState";
import { EXAM_MODULES, bandHistogram } from "../dashboardData";
import { useT } from "../../../i18n/useT";

/** An average with nothing behind it is shown as absent, never as zero. */
const asBand = (value) => (Number.isFinite(value) ? value.toFixed(1) : "—");

const ScoresPanel = ({ data, loading, error, onRetry }) => {
  const t = useT();

  const histogram = useMemo(
    () => bandHistogram(data?.distribution),
    [data?.distribution]
  );

  const branchRows = useMemo(
    () => (data?.byBranch || []).map((row) => ({ ...row, key: row.branchId })),
    [data?.byBranch]
  );

  if (error) return <PanelError error={error} onRetry={onRetry} />;

  const hasMarks = histogram.some((entry) => entry.count > 0);

  const branchColumns = [
    { title: t("dashboard.branch"), dataIndex: "branchName", key: "branchName" },
    {
      title: t("dashboard.averageBand"),
      dataIndex: "average",
      key: "average",
      align: "right",
      sorter: (a, b) => (a.average ?? -1) - (b.average ?? -1),
      render: asBand,
    },
    {
      title: t("dashboard.examsMarkedShort"),
      dataIndex: "examCount",
      key: "examCount",
      align: "right",
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={8} xl={4}>
        <StatTile
          label={t("dashboard.overallBand")}
          value={asBand(data?.average?.overall)}
          hint={`${data?.examCount ?? 0} ${t("dashboard.examsMarked")}`}
          to="/dashboard/results"
          loading={loading}
        />
      </Col>

      {EXAM_MODULES.map((module) => (
        <Col xs={24} sm={12} md={8} xl={5} key={module}>
          <StatTile
            label={t(`dashboard.${module}`)}
            value={asBand(data?.average?.[module])}
            loading={loading}
          />
        </Col>
      ))}

      <Col xs={24} xl={branchRows.length ? 14 : 24}>
        <ChartCard
          title={t("dashboard.bandDistribution")}
          subtitle={
            data?.from && data?.to ? `${data.from} — ${data.to}` : undefined
          }
          loading={loading}
          isEmpty={!hasMarks}
        >
          <HistogramChart items={histogram} />
        </ChartCard>
      </Col>

      {/* Empty for a branch admin, who only ever has one branch to compare. */}
      {branchRows.length > 0 && (
        <Col xs={24} xl={10}>
          <Card
            variant="outlined"
            title={t("dashboard.branchAverages")}
            styles={{ body: { padding: 0 } }}
          >
            <Table
              size="small"
              rowKey="key"
              loading={loading}
              columns={branchColumns}
              dataSource={branchRows}
              pagination={false}
            />
          </Card>
        </Col>
      )}
    </Row>
  );
};

export default ScoresPanel;
