import React from "react";
import { Alert, Button, Tag, Tooltip } from "antd";
import { ReloadOutlined, WarningOutlined } from "@ant-design/icons";
import { useT } from "../../../i18n/useT";

/**
 * A block that failed to load says so in its own frame.
 *
 * One panel erroring must not take the page down: every other block on the
 * dashboard is answering a different question from a different endpoint, and
 * an admin can still act on those.
 */
export const PanelError = ({ error, onRetry }) => {
  const t = useT();

  const status = error?.response?.status;
  const message =
    status === 403
      ? t("dashboard.noAccess")
      : error?.response?.data?.message || t("dashboard.loadFailed");

  return (
    <Alert
      type="error"
      showIcon
      message={message}
      action={
        onRetry && (
          <Button size="small" icon={<ReloadOutlined />} onClick={onRetry}>
            {t("common.retry")}
          </Button>
        )
      }
    />
  );
};

/**
 * Shown when a background refresh failed but the figures on screen are still
 * the last good ones — quieter than an error, because nothing is broken and
 * the next poll will most likely fix it.
 */
export const StaleBadge = ({ at }) => {
  const t = useT();

  return (
    <Tooltip title={t("dashboard.staleHint")}>
      <Tag icon={<WarningOutlined />} color="warning" style={{ marginInlineStart: 8 }}>
        {t("dashboard.stale")}
        {at ? ` · ${at}` : ""}
      </Tag>
    </Tooltip>
  );
};
