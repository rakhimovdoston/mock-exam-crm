import React from "react";
import { Card, Empty, Flex, Skeleton, Table, Typography } from "antd";
import { useT } from "../../../i18n/useT";

const { Text } = Typography;

/**
 * A chart with the same numbers available as a table underneath it.
 *
 * The table is not a nicety. The comparison series in these charts is
 * deliberately dim — in dark mode dim enough to sit under the 3:1 contrast
 * line — and the data-viz method only permits a mark that quiet when the
 * figures can also be read as text. It doubles as the accessible view.
 */
const ChartCard = ({
  title,
  subtitle,
  extra,
  loading,
  isEmpty,
  children,
  tableColumns,
  tableData,
}) => {
  const t = useT();

  return (
    <Card
      variant="outlined"
      title={
        <Flex vertical gap={2} style={{ paddingBlock: 10 }}>
          <Text strong style={{ fontSize: 15 }}>
            {title}
          </Text>
          {subtitle && (
            <Text type="secondary" style={{ fontSize: 12.5, fontWeight: 400 }}>
              {subtitle}
            </Text>
          )}
        </Flex>
      }
      extra={extra}
      styles={{ body: { paddingTop: 12 } }}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 5 }} title={false} />
      ) : isEmpty ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t("common.noData")}
        />
      ) : (
        <>
          {children}

          {Boolean(tableData?.length) && (
            <details style={{ marginTop: 14 }}>
              <summary
                style={{
                  cursor: "pointer",
                  fontSize: 13,
                  color: "inherit",
                  opacity: 0.7,
                }}
              >
                {t("dashboard.tableView")}
              </summary>
              <div style={{ marginTop: 12, overflowX: "auto" }}>
                <Table
                  size="small"
                  rowKey="key"
                  columns={tableColumns}
                  dataSource={tableData}
                  pagination={false}
                  scroll={{ x: "max-content" }}
                />
              </div>
            </details>
          )}
        </>
      )}
    </Card>
  );
};

export default ChartCard;
