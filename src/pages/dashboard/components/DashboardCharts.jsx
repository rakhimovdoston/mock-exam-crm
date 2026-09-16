import React from "react";
import { Bar, Column } from "@ant-design/plots";
import { useChartTheme } from "../chartTheme";

/**
 * Two series across a shared x axis.
 *
 * The first name in `domain` takes the brand hue and the second recedes into
 * grey: the reader follows one and uses the other as a backdrop, rather than
 * telling four colours apart. No value labels — two dozen of them would bury
 * the shape they describe.
 */
export const SeriesChart = ({ points, domain, height = 270 }) => {
  const { g2Theme, emphasis, context } = useChartTheme();

  return (
    <Column
      data={points}
      xField="month"
      yField="value"
      colorField="series"
      transform={[{ type: "dodgeX" }]}
      height={height}
      theme={g2Theme}
      scale={{ color: { domain, range: [emphasis, context].slice(0, domain.length) } }}
      axis={{
        x: { title: null, line: false, tick: false },
        y: { title: null, tick: false, nice: true },
      }}
      // One series needs no legend box — the card title already names it.
      legend={
        domain.length > 1
          ? { color: { position: "top", layout: { justifyContent: "flex-end" } } }
          : false
      }
      style={{ radiusTopLeft: 4, radiusTopRight: 4, insetLeft: 1, insetRight: 1 }}
    />
  );
};

/**
 * A ranked comparison — branches, packages, module averages.
 *
 * One hue, because the question is "which is biggest", not "which is which";
 * the names already carry identity. Few enough bars that each is labelled
 * directly, so the axis never has to be read across.
 */
export const RankingChart = ({ items, height, precision = 0 }) => {
  const { g2Theme, emphasis } = useChartTheme();

  const resolvedHeight =
    height ?? Math.max(150, Math.min(360, (items?.length || 1) * 42 + 40));

  return (
    <Bar
      data={items}
      xField="name"
      yField="value"
      height={resolvedHeight}
      theme={g2Theme}
      legend={false}
      scale={{ x: { domain: (items || []).map((item) => item.name) } }}
      axis={{
        x: { title: null, line: false, tick: false },
        y: { title: null, tick: false, nice: true },
      }}
      style={{ fill: emphasis, radiusTopLeft: 4, radiusTopRight: 4 }}
      label={{
        text: (item) => Number(item.value).toFixed(precision),
        textAlign: "left",
        dx: 6,
      }}
    />
  );
};

/**
 * Band distribution.
 *
 * Kept in band order — this axis is a scale, not a ranking, so it must never
 * be sorted by height. One hue: every bar is the same kind of thing.
 */
export const HistogramChart = ({ items, height = 220 }) => {
  const { g2Theme, emphasis } = useChartTheme();

  return (
    <Column
      data={items}
      xField="band"
      yField="count"
      height={height}
      theme={g2Theme}
      legend={false}
      scale={{ x: { domain: (items || []).map((item) => item.band) } }}
      axis={{
        x: { title: null, line: false, tick: false },
        y: { title: null, tick: false, nice: true },
      }}
      style={{ fill: emphasis, radiusTopLeft: 3, radiusTopRight: 3, insetLeft: 1, insetRight: 1 }}
    />
  );
};

/**
 * Monthly band averages.
 *
 * Columns rather than a line, and months with nothing marked carry no bar at
 * all. The axis still lists every month, so the gap sits where it belongs —
 * a line would either interpolate across it or need a null-handling flag to
 * stop it drawing a collapse that never happened.
 */
export const BandChart = ({ points, domain, height = 200 }) => {
  const { g2Theme, emphasis } = useChartTheme();

  return (
    <Column
      data={points}
      xField="month"
      yField="value"
      height={height}
      theme={g2Theme}
      legend={false}
      scale={{ x: { domain }, y: { domain: [0, 9], nice: false } }}
      axis={{
        x: { title: null, line: false, tick: false },
        y: { title: null, tick: false, tickCount: 4 },
      }}
      style={{ fill: emphasis, radiusTopLeft: 4, radiusTopRight: 4, insetLeft: 2, insetRight: 2 }}
      label={{ text: (item) => Number(item.value).toFixed(1), position: "top" }}
    />
  );
};
