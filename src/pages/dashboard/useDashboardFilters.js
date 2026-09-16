import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";

export const SCORE_RANGES = [7, 30, 90];
export const TREND_RANGES = [6, 12, 24];
const MAX_TREND_MONTHS = 36;

const clamp = (value, min, max, fallback) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(Math.max(number, min), max);
};

/**
 * Dashboard filters live in the query string.
 *
 * An admin who finds something worth showing someone sends the link, and the
 * same branch, day and period open on the other side. Keeping this state in
 * React alone would make every such link point at today's default view.
 */
const useDashboardFilters = () => {
  const [params, setParams] = useSearchParams();

  const filters = useMemo(() => {
    const branchRaw = params.get("branch");
    const dateRaw = params.get("date");
    const parsedDate = dateRaw ? dayjs(dateRaw, "YYYY-MM-DD", true) : null;

    return {
      branchId: branchRaw ? Number(branchRaw) : undefined,
      // An unparseable date in a hand-edited URL falls back to today rather
      // than sending "Invalid Date" to the API.
      date: parsedDate?.isValid() ? parsedDate : dayjs(),
      scoreDays: clamp(params.get("days"), 1, 365, 30),
      trendMonths: clamp(params.get("months"), 1, MAX_TREND_MONTHS, 12),
      dateBy: params.get("dateBy") === "created" ? "created" : "test",
      // ?demo=1 fills every panel with invented figures so the layout can be
      // read before the backend is up. The page says so on screen throughout.
      demo: params.get("demo") === "1",
    };
  }, [params]);

  const update = useCallback(
    (patch) => {
      const next = new URLSearchParams(params);

      Object.entries(patch).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") next.delete(key);
        else next.set(key, String(value));
      });

      // Replace, not push: changing a filter should not fill the back button
      // with every intermediate view.
      setParams(next, { replace: true });
    },
    [params, setParams]
  );

  return { ...filters, update };
};

export default useDashboardFilters;
