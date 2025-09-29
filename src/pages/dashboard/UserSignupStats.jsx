import React, { useEffect, useMemo, useState } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Typography,
  Space,
  Empty,
  DatePicker,
} from "antd";
import useApiRequest from "../../hooks/useApiRequest";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const UserSignupStats = () => {
  const [year, setYear] = useState(new Date().getFullYear());

  const { data, loading, error } =
    useApiRequest(`api/v1/dashboard/users/branch?year=${year}`, [year]) || {};
  const raw = data?.data ?? [];

  const {
    months,
    branchNames,
    overallTotal,
    latestMonth,
    totalsByMonth,
    totalsByBranch,
    pivotRows,
    pivotColumns,
  } = useMemo(() => {
    const normalizeBranch = (name) => name ?? "Not Branch";

    const monthSet = new Set();
    const monthTotals = new Map();
    const branchTotals = new Map();
    const stacked = [];

    // temp structure: month -> branch -> count
    const byMonthBranch = new Map();

    for (const row of raw) {
      const month = row.month?.slice(0, 7) ?? ""; // YYYY-MM
      const branch = normalizeBranch(row.branchName);
      const count = Number(row.userCount) || 0;
      if (!month) continue;

      monthSet.add(month);
      monthTotals.set(month, (monthTotals.get(month) || 0) + count);
      branchTotals.set(branch, (branchTotals.get(branch) || 0) + count);
      stacked.push({ month, branch, value: count });

      if (!byMonthBranch.has(month)) byMonthBranch.set(month, new Map());
      const inner = byMonthBranch.get(month);
      inner.set(branch, (inner.get(branch) || 0) + count);
    }

    const months = Array.from(monthSet).sort();
    const branchNames = Array.from(branchTotals.keys()).sort();

    const totalsByMonth = months.map((m) => ({
      month: m,
      total: monthTotals.get(m) || 0,
    }));
    const totalsByBranch = branchNames.map((b) => ({
      branch: b,
      total: branchTotals.get(b) || 0,
    }));
    const overallTotal = Array.from(monthTotals.values()).reduce(
      (a, b) => a + b,
      0
    );
    const latestMonth = months[months.length - 1] || null;

    // ---- Pivot table rows (rows=branches, columns=months) ----
    const pivotRows = branchNames.map((branch) => {
      const rowObj = { key: branch, branch };
      let rowTotal = 0;
      for (const m of months) {
        const val = byMonthBranch.get(m)?.get(branch) || 0;
        rowObj[m] = val;
        rowTotal += val;
      }
      rowObj.total = rowTotal;
      return rowObj;
    });

    const pivotColumns = [
      { title: "Branch", dataIndex: "branch", key: "branch", fixed: "left" },
      ...months.map((m) => ({
        title: m, // will render via formatter in Table columns below
        dataIndex: m,
        key: m,
        align: "right",
        sorter: (a, b) => (a[m] || 0) - (b[m] || 0),
      })),
      {
        title: "Total User",
        dataIndex: "total",
        key: "total",
        align: "right",
        sorter: (a, b) => (a.total || 0) - (b.total || 0),
      },
    ];

    return {
      months,
      branchNames,
      overallTotal,
      latestMonth,
      totalsByMonth,
      totalsByBranch,
      stackedData: stacked,
      pivotRows,
      pivotColumns,
    };
  }, [raw]);

  const [selectedBranches, setSelectedBranches] = useState(branchNames);
  useEffect(() => {
    setSelectedBranches(branchNames);
  }, [branchNames.join("|")]);

  const fmtMonth = (ym) => {
    if (!ym) return "";
    const [y, m] = ym.split("-").map((s) => parseInt(s, 10));
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  };

  const filteredTotalsByBranch = useMemo(
    () => totalsByBranch.filter((b) => selectedBranches.includes(b.branch)),
    [totalsByBranch, selectedBranches.join("|")]
  );

  const topBranch = useMemo(() => {
    const sorted = [...filteredTotalsByBranch].sort(
      (a, b) => b.total - a.total
    );
    return sorted[0] || { branch: "—", total: 0 };
  }, [filteredTotalsByBranch]);

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Title></Title>
      <DatePicker
        picker="year"
        value={dayjs(String(year), "YYYY")} // AntD `dayjs` obyekt kutadi
        onChange={(date) => {
          if (date) {
            setYear(date.year()); // faqat yil raqamini saqlaymiz
          } else {
            setYear(null);
          }
        }}
        format={(value) => `${value.year()} years`}
      />
      {/* KPI Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Total register" value={overallTotal} />
            <Text type="secondary">{branchNames.length} branches</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Months covered" value={months.length} />
            <Text type="secondary">
              {months.length
                ? `${fmtMonth(months[0])} → ${fmtMonth(months.at(-1))}`
                : "—"}
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Top branch" value={topBranch.branch} />
            <Text type="secondary">{topBranch.total} users</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Latest month"
              value={latestMonth ? fmtMonth(latestMonth) : "—"}
            />
            <Text type="secondary">
              {totalsByMonth.find((x) => x.month === latestMonth)?.total ?? 0}{" "}
              users
            </Text>
          </Card>
        </Col>
      </Row>
      <Card loading={loading} size="small">
        <Table
          sticky
          scroll={{ x: "max-content" }}
          rowKey={(r) => r.key}
          dataSource={pivotRows}
          columns={[
            { ...pivotColumns[0] },
            ...pivotColumns.slice(1, -1).map((col) => ({
              ...col,
              title: fmtMonth(col.title),
              render: (v) => v ?? 0,
            })),
            { ...pivotColumns[pivotColumns.length - 1], render: (v) => v ?? 0 },
          ]}
          loading={!!loading}
          pagination={false}
          locale={{
            emptyText: (
              <Empty description={error ? "Failed to load" : "No data"} />
            ),
          }}
        />
      </Card>
    </Space>
  );
};

export default UserSignupStats;
