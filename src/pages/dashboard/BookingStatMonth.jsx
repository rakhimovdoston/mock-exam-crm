import React, { useState, useMemo } from "react";
import { Table, Card, Typography, Space, DatePicker, Flex, Empty } from "antd";
import useApiRequest from "../../hooks/useApiRequest";
import dayjs from "dayjs";
import { Column, Pie } from "@ant-design/plots";

const { Text } = Typography;

function fmtMonth(ym) {
  if (!ym) return "";
  const [y, m] = ym.split("-").map((s) => parseInt(s, 10));
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

const BookingStatMonth = () => {
  const [year, setYear] = useState(new Date().getFullYear());

  const { data, loading, error } =
    useApiRequest(`api/v1/dashboard/booking/stat?year=${year}`, [year]) || {};
  const raw = data?.data ?? [];
  const { months, names, rows, columns, monthTotals, grandTotal } =
    useMemo(() => {
      const monthSet = new Set();
      const nameSet = new Set();

      // month -> name -> count
      const grid = new Map();
      // totals
      const totalsByMonth = new Map();

      for (const r of raw) {
        const m = (r.month ?? "").slice(0, 7); // YYYY-MM
        const n = r.name ?? "Unknown";
        const c = Number(r.count) || 0;
        if (!m) continue;
        monthSet.add(m);
        nameSet.add(n);

        if (!grid.has(n)) grid.set(n, new Map());
        const inner = grid.get(n);
        inner.set(m, (inner.get(m) || 0) + c);

        totalsByMonth.set(m, (totalsByMonth.get(m) || 0) + c);
      }

      const months = Array.from(monthSet).sort();
      const names = Array.from(nameSet).sort();

      const rows = names.map((name) => {
        const row = { key: name, name };
        let total = 0;
        for (const m of months) {
          const v = grid.get(name)?.get(m) || 0;
          row[m] = v;
          total += v;
        }
        row.total = total;
        return row;
      });

      const columns = [
        { title: "Package", dataIndex: "name", key: "name", fixed: "left" },
        ...months.map((m) => ({
          title: fmtMonth(m),
          dataIndex: m,
          key: m,
          align: "right",
          sorter: (a, b) => (a[m] || 0) - (b[m] || 0),
          render: (v) => v ?? 0,
        })),
        {
          title: "Total",
          dataIndex: "total",
          key: "total",
          align: "right",
          sorter: (a, b) => (a.total || 0) - (b.total || 0),
          render: (v) => v ?? 0,
        },
      ];

      const monthTotals = months.map((m) => ({
        m,
        total: totalsByMonth.get(m) || 0,
      }));
      const grandTotal = monthTotals.reduce((a, b) => a + b.total, 0);

      return { months, names, rows, columns, monthTotals, grandTotal };
    }, [raw]);

  return (
    <Space
      direction="vertical"
      size={16}
      style={{ width: "100%", marginTop: 16 }}
    >
      <Card
        title={
          <Flex justify="flex-start" align="center" gap="16px">
            <Text strong style={{ fontSize: 16 }}>
              Session based
            </Text>
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
          </Flex>
        }
        loading={loading}
        size="small"
      >
        <Table
          sticky
          scroll={{ x: "max-content" }}
          rowKey={(r) => r.key}
          dataSource={rows}
          columns={columns}
          pagination={false}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <Text strong>Total</Text>
                </Table.Summary.Cell>
                {months.map((m, idx) => (
                  <Table.Summary.Cell key={m} index={idx + 1} align="right">
                    <Text strong>
                      {monthTotals.find((x) => x.m === m)?.total ?? 0}
                    </Text>
                  </Table.Summary.Cell>
                ))}
                <Table.Summary.Cell index={months.length + 1} align="right">
                  <Text strong>{grandTotal}</Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>
    </Space>
  );
};

export default BookingStatMonth;
