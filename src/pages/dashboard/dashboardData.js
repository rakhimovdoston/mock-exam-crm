/**
 * Pure reshaping for the dashboard.
 *
 * The three dashboard endpoints hand back flat rows — one per month per
 * branch, or per month per package. Everything the page shows is derived from
 * those here rather than inside the components, so the arithmetic can be read
 * and checked on its own.
 */

const MONTH_COUNT = 12;

/** "2026-09" → 8 (zero-based). Returns -1 for anything unparseable. */
const monthIndexOf = (value) => {
  const match = /^(\d{4})-(\d{2})/.exec(value || "");
  if (!match) return -1;

  const index = Number(match[2]) - 1;
  return index >= 0 && index < MONTH_COUNT ? index : -1;
};

/** Short month names in the viewer's locale: Jan, Feb, … */
const monthLabels = () =>
  Array.from({ length: MONTH_COUNT }, (_, index) =>
    new Date(2000, index, 1).toLocaleDateString(undefined, { month: "short" })
  );

/**
 * Change between two figures, in percent.
 *
 * Returns null rather than a number when there is nothing to compare against —
 * a "+100%" printed beside a period that simply had no data is a fabricated
 * claim, and the tile hides the delta instead of inventing one.
 */
export const deltaPercent = (current, previous) => {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) return null;

  return Math.round(((current - previous) / previous) * 100);
};

/**
 * Totals per named dimension (branch, package), biggest first.
 *
 * Rows whose month cannot be read are skipped, exactly as the table below the
 * chart skips them — otherwise a ranking bar and its own table view could
 * disagree about the same figure.
 */
export const rankBy = (rows, nameKey, valueKey, fallbackName = "—") => {
  const totals = new Map();

  (rows || []).forEach((row) => {
    if (monthIndexOf(row?.month) === -1) return;

    const name = row?.[nameKey] || fallbackName;
    totals.set(name, (totals.get(name) || 0) + (Number(row[valueKey]) || 0));
  });

  return Array.from(totals, ([name, value]) => ({ name, value })).sort(
    (a, b) => b.value - a.value
  );
};

/**
 * Rows × months grid for the table view that sits under each chart.
 *
 * That table is not decoration: the comparison series is deliberately dim, and
 * the data-viz method only allows a mark that quiet when the same numbers are
 * also readable as text.
 */
export const pivotByMonth = (rows, nameKey, valueKey, fallbackName = "—") => {
  const labels = monthLabels();
  const grid = new Map();

  (rows || []).forEach((row) => {
    const index = monthIndexOf(row?.month);
    if (index === -1) return;

    const name = row?.[nameKey] || fallbackName;
    if (!grid.has(name)) grid.set(name, new Array(MONTH_COUNT).fill(0));

    grid.get(name)[index] += Number(row[valueKey]) || 0;
  });

  // Only months that actually carry a number become columns — a table of
  // twelve mostly-empty columns is harder to read than the chart it explains.
  const usedMonths = [];
  for (let index = 0; index < MONTH_COUNT; index += 1) {
    const used = Array.from(grid.values()).some((series) => series[index] > 0);
    if (used) usedMonths.push(index);
  }

  const data = Array.from(grid, ([name, series]) => {
    const entry = { key: name, name, total: 0 };

    usedMonths.forEach((index) => {
      entry[labels[index]] = series[index];
      entry.total += series[index];
    });

    return entry;
  }).sort((a, b) => b.total - a.total);

  return { columns: usedMonths.map((index) => labels[index]), data };
};

/* ── Shapes for the server-side dashboard endpoints ─────────────────────── */

export const EXAM_MODULES = ["listening", "reading", "writing", "speaking"];

/** "2026-09" → "Sep 26", short enough for twelve axis ticks. */
export const formatMonth = (value) => {
  const match = /^(\d{4})-(\d{2})/.exec(value || "");
  if (!match) return value || "";

  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  return date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
};

/**
 * `/dashboard/trend` months → two series.
 *
 * Completed is a subset of booked, so the pair is read as a gap rather than as
 * two independent lines: what is missing between them is what did not finish.
 */
export const trendSeries = (months, bookedLabel, completedLabel) =>
  (months || []).flatMap((row) => {
    const label = formatMonth(row?.month);
    return [
      { month: label, series: bookedLabel, value: Number(row?.bookings) || 0 },
      { month: label, series: completedLabel, value: Number(row?.completed) || 0 },
    ];
  });

/**
 * `/dashboard/scores` averages → a ranked list.
 *
 * Modules with no marked papers come back null and are dropped: a zero bar
 * would read as "everyone scored nothing" rather than "nothing marked yet".
 */
export const moduleAverages = (average, labelOf) =>
  EXAM_MODULES.map((module) => ({
    name: labelOf ? labelOf(module) : module,
    value: average?.[module],
  }))
    .filter((entry) => Number.isFinite(entry.value))
    .sort((a, b) => b.value - a.value);

/** Band histogram, kept in band order — this axis is a scale, not a ranking. */
export const bandHistogram = (distribution) =>
  (distribution || []).map((row) => ({
    band: Number(row?.band).toFixed(1),
    count: Number(row?.count) || 0,
  }));

/**
 * Change between two periods, described rather than reduced to a number.
 *
 * A previous period of zero has no percentage — "+100%" against nothing is
 * meaningless — so it is reported as "new" and the caller words it. Missing
 * figures produce nothing at all rather than a fabricated zero.
 */
export const growth = (current, previous) => {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return { kind: "none" };
  if (previous === 0) return current > 0 ? { kind: "new" } : { kind: "none" };

  return { kind: "percent", value: Math.round(((current - previous) / previous) * 100) };
};

/**
 * Monthly band averages, with unmarked months genuinely absent.
 *
 * The axis still carries every month, so the gaps land in the right places;
 * the data simply has no bar there. Plotting a null as zero would draw a
 * collapse that never happened.
 */
export const bandPoints = (months) => {
  const domain = (months || []).map((row) => formatMonth(row?.month));

  const points = (months || [])
    .filter((row) => Number.isFinite(row?.averageBand))
    .map((row) => ({
      month: formatMonth(row.month),
      value: Number(row.averageBand),
    }));

  return { points, domain };
};

/**
 * `/dashboard/capacity` days → a day × shift grid.
 *
 * Shift columns are taken from the data in the order they arrive rather than
 * hardcoded: a branch that never runs an evening session should not be shown
 * an empty evening column every day.
 */
export const capacityGrid = (days) => {
  const shifts = [];

  (days || []).forEach((day) =>
    (day?.shifts || []).forEach((shift) => {
      if (shift?.testTime && !shifts.includes(shift.testTime)) {
        shifts.push(shift.testTime);
      }
    })
  );

  const rows = (days || []).map((day) => ({
    key: day?.date,
    date: day?.date,
    cells: shifts.map((testTime) => {
      const shift = (day?.shifts || []).find((entry) => entry?.testTime === testTime);
      if (!shift) return { testTime, empty: true };

      const capacity = Number(shift.capacity) || 0;
      const booked = Number(shift.booked) || 0;

      return {
        testTime,
        capacity,
        booked,
        free: Number(shift.free) || 0,
        // Null, not zero: with no ceiling recorded there is nothing to be a
        // percentage of, and a "0% full" cell would be a claim.
        fill: capacity > 0 ? Math.round((booked / capacity) * 100) : null,
      };
    }),
  }));

  return { shifts, rows };
};
