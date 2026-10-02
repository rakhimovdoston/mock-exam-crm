import { useEffect, useRef } from "react";
import usePolledRequest from "./usePolledRequest";
import { audioRetryStateUrl, reportAudioFailure } from "../utils/audioRetry";

/** Often enough that an invigilator's approval lands while they are still
 *  standing at the machine, rarely enough to be free during an exam. */
const POLL_MS = 15000;

/**
 * Whether this candidate may download their recordings again.
 *
 * Asked for only once something has actually failed. A sitting where every
 * part arrived has nothing to ask about, and polling through it would be one
 * more request per machine every fifteen seconds for no reason at all.
 *
 * The failure is reported upwards too, so the duty admin sees a hall going
 * wrong without waiting to be told. That report is fire-and-forget by design:
 * the sitting must never depend on it.
 */
const useAudioRetryApproval = (examUniqueId, failedIndexes) => {
  const hasFailure = failedIndexes.length > 0;

  const { data, loading, refetch } = usePolledRequest(
    hasFailure && examUniqueId ? audioRetryStateUrl(examUniqueId) : null,
    POLL_MS
  );

  // Read inside the effect without being a dependency of it: the array is
  // rebuilt upstream on every render, while the signature below is what
  // actually decides whether this is news.
  const failedRef = useRef(failedIndexes);
  failedRef.current = failedIndexes;

  // Reported once per distinct set of failures: parts give up one after
  // another, and each one must not become its own alert.
  const reportedRef = useRef("");
  const signature = failedIndexes.join(",");

  useEffect(() => {
    if (!examUniqueId || !signature) return;
    if (reportedRef.current === signature) return;

    reportedRef.current = signature;
    reportAudioFailure(examUniqueId, failedRef.current);
  }, [examUniqueId, signature]);

  const state = data?.data;

  return {
    allowed: Boolean(state?.allowed),
    approvedByName: state?.approvedByName ?? null,
    approvedAt: state?.approvedAt ?? null,
    checking: loading,
    refresh: refetch,
  };
};

export default useAudioRetryApproval;
