import React, { useMemo } from "react";
import { Card, Skeleton, Space, Typography } from "antd";
import CapacityHeatmap from "../components/CapacityHeatmap";
import { PanelError } from "../components/PanelState";
import { capacityGrid } from "../dashboardData";
import { useT } from "../../../i18n/useT";

const { Text } = Typography;

/**
 * How full the coming days are.
 *
 * Called branch capacity throughout, never session capacity: the ceiling comes
 * from the branch record, so every shift in a day shows the same number. An
 * admin reading it as "this morning session holds 30" would plan wrongly.
 */
const CapacityPanel = ({ data, loading, error, onRetry }) => {
  const t = useT();
  const { shifts, rows } = useMemo(() => capacityGrid(data?.days), [data?.days]);

  if (error) return <PanelError error={error} onRetry={onRetry} />;

  return (
    <Card
      variant="outlined"
      title={
        <Space direction="vertical" size={0} style={{ paddingBlock: 8 }}>
          <Text strong style={{ fontSize: 15 }}>
            {t("dashboard.capacityTitle")}
          </Text>
          <Text type="secondary" style={{ fontSize: 12.5, fontWeight: 400 }}>
            {t("dashboard.capacityCaveat")}
          </Text>
        </Space>
      }
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 5 }} title={false} />
      ) : rows.length ? (
        <CapacityHeatmap shifts={shifts} rows={rows} />
      ) : (
        <Text type="secondary">{t("common.noData")}</Text>
      )}
    </Card>
  );
};

export default CapacityPanel;
