import React, { useMemo } from "react";
import { Segmented, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import usePolledRequest from "../../../hooks/usePolledRequest";
import ChartCard from "../components/ChartCard";
import { RankingChart } from "../components/DashboardCharts";
import { PanelError } from "../components/PanelState";
import { pivotByMonth, rankBy } from "../dashboardData";
import { useT } from "../../../i18n/useT";

const DATE_BY = { TEST: "test", CREATED: "created" };

/**
 * Which branch the bookings went to.
 *
 * Admin-only: a branch admin already sees one branch, and a ranking of one bar
 * says nothing.
 */
const BreakdownPanel = ({ year, dateBy, onDateByChange, demoRows }) => {
  const t = useT();

  const url = `api/v1/dashboard/bookings/branch?year=${year}&dateBy=${dateBy}`;
  const { data, loading, error, refetch } = usePolledRequest(demoRows ? null : url);
  const rows = demoRows ?? data?.data;

  const ranked = useMemo(
    () => rankBy(rows, "branchName", "bookingCount", t("dashboard.noBranch")),
    [rows, t]
  );

  const pivot = useMemo(
    () => pivotByMonth(rows, "branchName", "bookingCount", t("dashboard.noBranch")),
    [rows, t]
  );

  const columns = useMemo(
    () => [
      { title: t("dashboard.branch"), dataIndex: "name", key: "name", fixed: "left" },
      ...pivot.columns.map((month) => ({
        title: month,
        dataIndex: month,
        key: month,
        align: "right",
        render: (value) => value ?? 0,
      })),
      { title: t("dashboard.total"), dataIndex: "total", key: "total", align: "right" },
    ],
    [pivot.columns, t]
  );

  if (error && !demoRows) return <PanelError error={error} onRetry={refetch} />;

  return (
    <ChartCard
      title={t("dashboard.byBranch")}
      subtitle={
        dateBy === DATE_BY.TEST
          ? t("dashboard.byTestDate")
          : t("dashboard.byCreatedDate")
      }
      extra={
        <Segmented
          size="small"
          value={dateBy}
          onChange={onDateByChange}
          options={[
            {
              value: DATE_BY.TEST,
              // The two never give the same number — a booking made in March
              // for an April sitting lands in a different month each way.
              label: (
                <Tooltip title={t("dashboard.byTestDateHint")}>
                  {t("dashboard.testDate")} <InfoCircleOutlined />
                </Tooltip>
              ),
            },
            {
              value: DATE_BY.CREATED,
              label: (
                <Tooltip title={t("dashboard.byCreatedDateHint")}>
                  {t("dashboard.createdDate")} <InfoCircleOutlined />
                </Tooltip>
              ),
            },
          ]}
        />
      }
      loading={loading}
      isEmpty={!ranked.length}
      tableColumns={columns}
      tableData={pivot.data}
    >
      <RankingChart items={ranked} />
    </ChartCard>
  );
};

export default BreakdownPanel;
