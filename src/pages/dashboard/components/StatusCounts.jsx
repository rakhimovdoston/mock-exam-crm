import React from "react";
import { Col, Row } from "antd";
import usePolledRequest from "../../../hooks/usePolledRequest";
import StatTile from "./StatTile";

/**
 * One tile, counting one status.
 *
 * There is no endpoint that returns speaking counts per status, but the list
 * endpoint paginates — so asking for a single row and reading `totalSizes`
 * gives the exact figure under whatever date and branch are filtered, without
 * pulling any rows down.
 */
const StatusCount = ({ url, label, tone, active, onSelect, example }) => {
  // A supplied example means nothing is requested at all.
  const { data, loading } = usePolledRequest(example == null ? url : null);

  return (
    <StatTile
      label={label}
      value={example ?? data?.data?.totalSizes ?? 0}
      tone={tone}
      active={active}
      onClick={onSelect}
      loading={example == null && loading}
    />
  );
};

/**
 * Status counts above a list, each one a filter for it.
 *
 * Rendered as separate children rather than a loop of hooks: the request count
 * is fixed by `statuses`, but a hook inside a map is a rule nobody should have
 * to reason about later.
 */
const StatusCounts = ({ statuses, buildUrl, selected, onSelect, examples }) => (
  <Row gutter={[16, 16]}>
    {statuses.map((status) => {
      const isActive = Array.isArray(selected) && selected.includes(status.value);

      return (
        <Col xs={12} sm={12} md={6} key={status.value}>
          <StatusCount
            url={buildUrl(status.value)}
            example={examples?.[status.value]}
            label={status.label}
            tone={status.tone}
            active={isActive}
            // Clicking the active tile clears the filter, so the same control
            // that narrowed the list also puts it back.
            onSelect={() => onSelect(isActive ? [] : [status.value])}
          />
        </Col>
      );
    })}
  </Row>
);

export default StatusCounts;
