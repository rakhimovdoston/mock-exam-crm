import React from "react";
import { Card, Skeleton, Tooltip, Typography, theme } from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import CountUp from "react-countup";
import { useT } from "../../../i18n/useT";

const { Text } = Typography;

/**
 * One headline figure.
 *
 * A number on a dashboard is a door: where a page lists what the figure counts,
 * the whole tile leads to it, so reading "5 no-shows" and acting on it is one
 * click rather than a hunt through the menu. `to` navigates; `onClick` filters
 * in place, which is what it does when the list is already on screen below.
 *
 * `tone` is semantic state, deliberately separate from the chart accent, and it
 * never carries meaning on its own — a toned tile always has a label saying
 * what it is.
 */
const StatTile = ({
  label,
  tooltip,
  value,
  hint,
  tone = "default",
  growth,
  growthLabel,
  to,
  onClick,
  active = false,
  loading,
}) => {
  const { token } = theme.useToken();
  const t = useT();

  const toneColor = {
    default: token.colorText,
    warning: token.colorWarning,
    danger: token.colorError,
  }[tone];

  const renderGrowth = () => {
    if (!growth || growth.kind === "none") return null;

    if (growth.kind === "new") {
      return (
        <Text style={{ fontSize: 13, fontWeight: 600, color: token.colorSuccess }}>
          {t("dashboard.brandNew")}
        </Text>
      );
    }

    const rising = growth.value >= 0;
    return (
      <Text
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: rising ? token.colorSuccess : token.colorError,
        }}
      >
        {rising ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(growth.value)}%
      </Text>
    );
  };

  const showGrowth = Boolean(growth) && growth.kind !== "none";

  const body = (
    <Card
      variant="outlined"
      styles={{ body: { padding: 18 } }}
      style={{
        height: "100%",
        cursor: onClick ? "pointer" : undefined,
        // A tile that is currently filtering the list below says so, or the
        // only clue that a filter is on would be the list itself.
        borderColor: active ? token.colorPrimary : undefined,
        boxShadow: active ? `0 0 0 1px ${token.colorPrimary}` : undefined,
      }}
      hoverable={Boolean(to || onClick)}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      aria-pressed={onClick ? active : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              onClick();
            }
          : undefined
      }
    >
      {loading ? (
        <Skeleton
          active
          title={{ width: "45%" }}
          paragraph={{ rows: 1, width: "65%" }}
        />
      ) : (
        <>
          <Text
            type="secondary"
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 0.4,
              textTransform: "uppercase",
            }}
          >
            {label}
            {tooltip && (
              <Tooltip title={tooltip}>
                <InfoCircleOutlined style={{ marginInlineStart: 6, opacity: 0.65 }} />
              </Tooltip>
            )}
          </Text>

          <div
            style={{
              margin: "6px 0 4px",
              fontSize: 30,
              fontWeight: 700,
              lineHeight: 1.15,
              fontVariantNumeric: "tabular-nums",
              color: toneColor,
            }}
          >
            {typeof value === "number" ? (
              <CountUp end={value} separator=" " duration={0.9} />
            ) : (
              value ?? "—"
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 22 }}>
            {renderGrowth()}
            {(hint || growthLabel) && (
              <Text type="secondary" style={{ fontSize: 12.5 }}>
                {showGrowth ? growthLabel : hint}
              </Text>
            )}
          </div>
        </>
      )}
    </Card>
  );

  if (!to || onClick || loading) return body;

  return (
    <Link to={to} style={{ display: "block", height: "100%" }}>
      {body}
    </Link>
  );
};

export default StatTile;
