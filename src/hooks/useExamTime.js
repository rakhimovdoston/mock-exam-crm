import { useCallback, useEffect, useRef, useState } from "react";
import apiClient from "../services/api";

/**
 * Deliberately not slowed down when the tab is hidden: a student who switched
 * away must still be told about extra time within one interval.
 */
export const TIME_POLL_INTERVAL_MS = 20000;

const TICK_MS = 500;

const fetchTimeState = async (examUniqueId, moduleType, knownVersion) => {
  const params = new URLSearchParams({ moduleType });

  // The very first call must not carry knownVersion — that response is the
  // baseline, and sending a version we never received would report a change
  // that never happened.
  if (knownVersion != null) params.set("knownVersion", String(knownVersion));

  const response = await apiClient.get(
    `api/v1/exam/time-state/${examUniqueId}?${params.toString()}`
  );

  if (response?.code !== 200 || !response?.data) {
    const error = new Error(response?.message || "time-state failed");
    error.apiPayload = response;
    throw error;
  }

  return response.data;
};

/**
 * The module's clock, owned by the server.
 *
 * Nothing here knows how long a module is supposed to last — that came from
 * hardcoded constants before, and now only `leftDurationMs` decides. The local
 * interval exists purely to animate the number between polls, so a dropped
 * connection slows nothing down.
 */
const useExamTime = (examUniqueId, moduleType) => {
  const [state, setState] = useState(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [change, setChange] = useState(null);

  // The student's clock may be wrong by minutes; every comparison is done in
  // server time, reconstructed as Date.now() + offset.
  const offsetRef = useRef(0);
  const endsAtRef = useRef(0);
  const versionRef = useRef(null);

  const apply = useCallback((payload) => {
    offsetRef.current = payload.serverTime - Date.now();
    endsAtRef.current = payload.serverTime + (payload.leftDurationMs ?? 0);

    setState(payload);
    setRemainingMs(payload.leftDurationMs ?? 0);

    // timeChanged is only meaningful once a knownVersion has been sent, so the
    // first response can never raise the notice.
    if (payload.timeChanged && versionRef.current != null) {
      setChange({
        // Shown verbatim: the server words it according to which level was
        // granted — this module, the whole sitting, or both — and rebuilding
        // that sentence here would only ever go out of step with it.
        message: payload.message,
        extraTimeMs: payload.extraTimeMs,
        examExtraTimeMs: payload.examExtraTimeMs,
        version: payload.timeVersion,
      });
    }

    versionRef.current = payload.timeVersion;
  }, []);

  const load = useCallback(
    async (withVersion) => {
      const payload = await fetchTimeState(
        examUniqueId,
        moduleType,
        withVersion ? versionRef.current : null
      );
      apply(payload);
      return payload;
    },
    [examUniqueId, moduleType, apply]
  );

  // First read: establishes the baseline version and the clock offset.
  useEffect(() => {
    if (!examUniqueId) return undefined;

    let cancelled = false;
    versionRef.current = null;
    setLoading(true);

    load(false)
      .catch((error) => {
        if (cancelled) return;
        if (error?.response?.status === 404) setNotFound(true);
        else console.error("Could not read the exam clock:", error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [examUniqueId, moduleType, load]);

  // Poll for extra time.
  useEffect(() => {
    if (!examUniqueId) return undefined;

    const poll = () =>
      load(true).catch((error) => {
        if (error?.response?.status === 404) {
          setNotFound(true);
          return;
        }
        // A dropped connection must not stop the clock and must not raise a
        // dialog mid-exam — the local tick carries on and the next poll heals.
        console.error("Exam clock poll failed:", error);
      });

    const timer = setInterval(poll, TIME_POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [examUniqueId, load]);

  // Animate the countdown between polls.
  const running = Boolean(state?.started) && !state?.finished;

  useEffect(() => {
    if (!running) return undefined;

    const tick = () => {
      const serverNow = Date.now() + offsetRef.current;
      setRemainingMs(Math.max(0, endsAtRef.current - serverNow));
    };

    tick();
    const timer = setInterval(tick, TICK_MS);
    return () => clearInterval(timer);
  }, [running]);

  const acknowledgeChange = useCallback(() => setChange(null), []);

  // Stable, so the callers that depend on it do not re-register every render.
  const refresh = useCallback(() => load(true), [load]);

  return {
    state,
    remainingMs,
    remainingSeconds: Math.ceil(remainingMs / 1000),
    started: Boolean(state?.started),
    finished: Boolean(state?.finished),
    running,
    examLeftDurationMs: state?.examLeftDuration ?? null,
    loading,
    notFound,
    change,
    acknowledgeChange,
    /** Re-read now — used before auto-submitting, in case time was just added. */
    refresh,
  };
};

export default useExamTime;
