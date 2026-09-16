import React from "react";
import { Tooltip, Typography, theme } from "antd";
import dayjs from "dayjs";
import { useChartTheme } from "../chartTheme";
import { useShiftLabel } from "../../../utils/extraTime";
import { useT } from "../../../i18n/useT";

const { Text } = Typography;

/**
 * Five steps of one hue, light to dark — the sequential rule. A rainbow here
 * would imply the categories differ in kind rather than in degree.
 */
const STEPS = [0.1, 0.28, 0.46, 0.66, 0.86];

const stepFor = (fill) => {
  if (fill == null) return null;
  if (fill < 20) return 0;
  if (fill < 40) return 1;
  if (fill < 60) return 2;
  if (fill < 80) return 3;
  return 4;
};

const hexToRgba = (hex, alpha) => {
  const value = hex.replace("#", "");
  const int = parseInt(value, 16);
  return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${alpha})`;
};

/**
 * How full each session is over the coming days.
 *
 * Built as a grid rather than a chart component so every cell can carry its
 * own number: the fill is written in each square, never signalled by colour
 * alone. Cells with no ceiling recorded stay blank rather than reading 0%.
 */
const CapacityHeatmap = ({ shifts, rows }) => {
  const t = useT();
  const { token } = theme.useToken();
  const { emphasis } = useChartTheme();
  const shiftLabel = useShiftLabel();

  if (!rows?.length) return null;

  return (
    <div style={{ overflowX: "auto" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `minmax(96px, auto) repeat(${shifts.length}, minmax(96px, 1fr))`,
          gap: 4,
          minWidth: 96 + shifts.length * 100,
        }}
      >
        <div />
        {shifts.map((shift) => (
          <Text
            key={shift}
            type="secondary"
            style={{ fontSize: 12, fontWeight: 600, textAlign: "center" }}
          >
            {shiftLabel(shift)}
          </Text>
        ))}

        {rows.map((row) => (
          <React.Fragment key={row.key}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <Text style={{ fontSize: 12.5 }}>
                {dayjs(row.date).format("DD MMM, ddd")}
              </Text>
            </div>

            {row.cells.map((cell) => {
              const step = stepFor(cell.fill);
              const filled = step != null;
              // Light ink only once the square is dark enough to need it.
              const onDark = step != null && step >= 3;

              return (
                <Tooltip
                  key={`${row.key}-${cell.testTime}`}
                  title={
                    cell.empty || !filled
                      ? t("common.noData")
                      : `${cell.booked} / ${cell.capacity} · ${t("dashboard.free")}: ${cell.free}`
                  }
                >
                  <div
                    style={{
                      display: "grid",
                      placeItems: "center",
                      minHeight: 44,
                      borderRadius: 8,
                      border: `1px solid ${token.colorBorderSecondary}`,
                      background: filled
                        ? hexToRgba(emphasis, STEPS[step])
                        : token.colorFillQuaternary,
                      color: onDark ? "#FFFFFF" : token.colorText,
                      fontSize: 13,
                      fontWeight: 600,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {filled ? `${cell.fill}%` : "—"}
                  </div>
                </Tooltip>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default CapacityHeatmap;
