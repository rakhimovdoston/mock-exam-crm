import { useCallback, useEffect, useRef, useState } from "react";
import apiClient from "../services/api";

/**
 * A GET that can keep itself current.
 *
 * Two things separate it from a plain fetch hook, and both matter on a screen
 * someone leaves open all morning:
 *
 * - Polling stops while the tab is hidden and fires once the moment it comes
 *   back, so a backgrounded dashboard neither burns requests nor shows figures
 *   from an hour ago.
 * - A failed *poll* never blanks what is already on screen. The previous
 *   answer stays put and `stale` goes true, so the panel can say it did not
 *   refresh rather than pretending the centre suddenly has no bookings.
 *
 * A falsy url means "not applicable here" — a role that may not read this
 * resource — and nothing is requested.
 */
const usePolledRequest = (url, intervalMs = 0) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState(null);
  const [stale, setStale] = useState(false);

  // Whether anything has ever arrived for the current url; a first failure is
  // an error, a later one is only staleness.
  const hasDataRef = useRef(false);

  const load = useCallback(
    async (isPoll) => {
      if (!url) return;
      if (!isPoll) setLoading(true);

      try {
        const response = await apiClient.get(url);
        setData(response);
        hasDataRef.current = true;
        setError(null);
        setStale(false);
      } catch (err) {
        if (isPoll && hasDataRef.current) setStale(true);
        else setError(err);
      } finally {
        if (!isPoll) setLoading(false);
      }
    },
    [url]
  );

  useEffect(() => {
    hasDataRef.current = false;

    if (!url) {
      setData(null);
      setLoading(false);
      return;
    }

    load(false);
  }, [url, load]);

  useEffect(() => {
    if (!url || !intervalMs) return undefined;

    let timer = null;
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const start = () => {
      stop();
      timer = setInterval(() => load(true), intervalMs);
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        stop();
        return;
      }
      // Catch up straight away rather than waiting out a whole interval.
      load(true);
      start();
    };

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [url, intervalMs, load]);

  return { data, loading, error, stale, refetch: () => load(false) };
};

export default usePolledRequest;
