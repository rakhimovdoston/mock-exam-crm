import React from "react";
import { Col, Row } from "antd";
import StatTile from "../components/StatTile";
import { PanelError } from "../components/PanelState";
import { growth } from "../dashboardData";
import { useT } from "../../../i18n/useT";

/**
 * All-time totals, with how they moved over the past month.
 *
 * Kept at the foot of the page: these answer "how are we doing overall",
 * which is a monthly question, not the one an admin opens the panel with.
 *
 * Material counts are not scoped by branch — they are shared content — so a
 * branch admin sees the network figure here while the candidate counts beside
 * them are their own branch's.
 */
const ArchivePanel = ({ data, loading, error, onRetry, isAdmin }) => {
  const t = useT();

  if (error) return <PanelError error={error} onRetry={onRetry} />;

  const before = data?.previous;

  const tiles = [
    { key: "totalUsers", label: t("dashboard.allUsers"), to: "/dashboard/users" },
    { key: "everester", label: t("dashboard.everester"), to: "/dashboard/users" },
    { key: "onlineRegister", label: t("dashboard.onlineRegister"), to: "/dashboard/users" },
  ];

  const materials = [
    { key: "totalListening", label: t("dashboard.allListening"), to: "/dashboard/ielts/listening" },
    { key: "totalReading", label: t("dashboard.allReading"), to: "/dashboard/ielts/reading" },
    { key: "totalWriting", label: t("dashboard.allWriting"), to: "/dashboard/ielts/writing" },
  ];

  const all = isAdmin ? [...tiles, ...materials] : tiles;

  return (
    <Row gutter={[16, 16]}>
      {all.map((tile) => (
        <Col xs={24} sm={12} md={8} xl={4} key={tile.key}>
          <StatTile
            label={tile.label}
            value={data?.[tile.key]}
            growth={growth(data?.[tile.key], before?.[tile.key])}
            growthLabel={t("dashboard.vsLastMonth")}
            to={tile.to}
            loading={loading}
          />
        </Col>
      ))}
    </Row>
  );
};

export default ArchivePanel;
