import React from "react";
import { Card, Skeleton } from "antd";
import { useT } from "../i18n/useT";

const ROW_COUNT = 6;

// Uneven widths so the placeholder reads as a table of real rows rather than a
// block of identical grey bars.
const CELL_WIDTHS = ["22%", "16%", "26%", "12%"];

/**
 * What the content area shows while a lazily-loaded page arrives.
 *
 * Shaped like the page that is coming — heading, a row of filters, a table —
 * so the layout does not jump once it does. The bar at the top is
 * indeterminate on purpose: a chunk download has no honest percentage.
 */
const RouteFallback = () => {
  const t = useT();

  return (
    <div className="route-fallback" role="status" aria-live="polite">
      <span className="route-progress" aria-hidden="true">
        <i />
      </span>
      <span className="visually-hidden">{t("common.loading")}</span>

      <Skeleton.Input active size="large" style={{ width: 240 }} />

      <div className="route-fallback__toolbar" aria-hidden="true">
        <Skeleton.Input active style={{ width: 220 }} />
        <Skeleton.Input active style={{ width: 150 }} />
        <Skeleton.Button active />
      </div>

      <Card variant="outlined" styles={{ body: { padding: 0 } }} aria-hidden="true">
        {Array.from({ length: ROW_COUNT }, (_, row) => (
          <div className="route-fallback__row" key={row}>
            {CELL_WIDTHS.map((width, cell) => (
              <Skeleton.Input
                key={cell}
                active
                size="small"
                style={{ width, minWidth: 40 }}
              />
            ))}
          </div>
        ))}
      </Card>
    </div>
  );
};

export default RouteFallback;
