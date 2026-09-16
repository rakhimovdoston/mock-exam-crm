import React from "react";
import { Col, Row } from "antd";
import StatTile from "../components/StatTile";
import { PanelError } from "../components/PanelState";
import { useT } from "../../../i18n/useT";

/**
 * Today's speaking, for the examiner who will sit it.
 *
 * A speaker cannot reach the speaking session list's own filters, so these
 * three figures are all the overview they get: how many sessions today, how
 * many already scored, how many still waiting on them.
 */
const SpeakingTodayPanel = ({ data, loading, error, onRetry }) => {
  const t = useT();

  if (error) return <PanelError error={error} onRetry={onRetry} />;

  const speaking = data?.speaking;

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={8}>
        <StatTile
          label={t("dashboard.speakingToday")}
          value={speaking?.total}
          to="/dashboard/speaking"
          loading={loading}
        />
      </Col>
      <Col xs={24} sm={8}>
        <StatTile
          label={t("dashboard.speakingScored")}
          value={speaking?.scored}
          to="/dashboard/speaking"
          loading={loading}
        />
      </Col>
      <Col xs={24} sm={8}>
        <StatTile
          label={t("dashboard.speakingPending")}
          value={speaking?.pending}
          tone={speaking?.pending > 0 ? "warning" : "default"}
          to="/dashboard/speaking"
          loading={loading}
        />
      </Col>
    </Row>
  );
};

export default SpeakingTodayPanel;
