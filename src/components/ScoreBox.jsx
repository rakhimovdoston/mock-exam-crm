import { Button, Tooltip, Typography, theme } from "antd";
import { Link } from "react-router-dom";
import { EyeOutlined } from "@ant-design/icons";

const { Text } = Typography;

/** Where a module's answers can be read back, when they can be read at all. */
const answerPath = (label, id, userId) => {
  if (label === "Writing") return `/dashboard/history/${userId}/writing/${id}`;
  if (label === "Speaking") return null; // no answer sheet — it is spoken
  return `/dashboard/history/${id}/${label.toLowerCase()}`;
};

/**
 * One module's band in a booking.
 *
 * The band is the thing being looked at, so it is the largest thing in the
 * tile; the module name is a label above it, not a heading. A tile with
 * nothing to show says so rather than printing `0.0`, which reads as a band
 * the candidate was actually given — the same rule the dashboard follows for
 * unscored modules.
 *
 * All four tiles are the same height whatever they contain: the action row is
 * pushed to the bottom, so Speaking (which has no answers to open) no longer
 * needs a spacer to keep the row from going ragged.
 */
const ScoreBox = ({
  id,
  icon,
  label,
  score,
  userId,
  booking = false,
  isBeforeDate = false,
}) => {
  const { token } = theme.useToken();

  // A booking whose test date has passed and still has no result.
  const overdue = booking && !isBeforeDate;

  const value = Number(score);
  const scored = Number.isFinite(value) && value > 0;

  const to = booking ? null : answerPath(label, id, userId);

  const accent = overdue ? token.colorError : token.colorPrimary;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        width: 118,
        minHeight: 132,
        padding: "12px 10px",
        borderRadius: 12,
        background: overdue ? token.colorErrorBg : token.colorFillQuaternary,
        border: `1px solid ${
          overdue ? token.colorErrorBorder : token.colorBorderSecondary
        }`,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          color: token.colorTextSecondary,
        }}
      >
        {icon}
        {label}
      </span>

      <Text
        style={{
          margin: "6px 0 0",
          fontSize: 26,
          fontWeight: 700,
          lineHeight: 1.1,
          fontVariantNumeric: "tabular-nums",
          color: scored ? accent : token.colorTextQuaternary,
        }}
      >
        {scored ? value.toFixed(1) : "—"}
      </Text>

      <Text type="secondary" style={{ fontSize: 11 }}>
        {scored ? "band" : "not scored"}
      </Text>

      {/* Pushed down, so every tile ends at the same line. */}
      <div style={{ marginTop: "auto", paddingTop: 8 }}>
        {to && (
          <Tooltip title={`Open ${label} answers`}>
            <Link to={to}>
              <Button size="small" icon={<EyeOutlined />} />
            </Link>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default ScoreBox;
