import apiClient from "../services/api";

// Same shift vocabulary and the same two error shapes as the other two admin
// exam operations. Defined once in extraTime.js because that feature needed
// them first; re-exported here so callers never reach across features.
export {
  MAX_REASON_LENGTH,
  TEST_SHIFTS,
  parseAmbiguousShifts,
  parseApiError,
  useShiftLabel,
} from "./extraTime";

const ADMIN_BASE = "api/v1/admin/exam-audio";
const APPROVAL_URL = `${ADMIN_BASE}/retry-approval`;

/** Candidate-side paths (camelCase family). */
export const audioRetryStateUrl = (examUniqueId) =>
  `api/v1/exam/audio-retry/${examUniqueId}`;

const audioFailureUrl = (examUniqueId) =>
  `api/v1/exam/audio-failure/${examUniqueId}`;

export const APPROVAL_STATUS = {
  ACTIVE: "ACTIVE",
  REVOKED: "REVOKED",
  EXPIRED: "EXPIRED",
};

/**
 * The envelope carries its own `code`, and the backend also answers with real
 * HTTP errors — a refusal can arrive either way. Both become a thrown error
 * here, with the payload attached, so callers have a single path.
 */
const send = async (method, url, body) => {
  const response = await apiClient[method](url, body);

  if (response?.success === false || response?.code !== 200) {
    const error = new Error(response?.message || "");
    error.apiPayload = response;
    throw error;
  }

  return response.data;
};

/**
 * How this booking is addressed.
 *
 * `{ userId, date, testTime }` is the normal case — a booking screen knows all
 * three — and `{ examId }` is the fallback for a screen that only has the
 * exam's own id. The same pair of paths the other two admin exam operations
 * use, so one target object works for all three.
 */
const byTarget = (target, suffix = "") =>
  target?.examId
    ? `${APPROVAL_URL}/${target.examId}${suffix}`
    : `${APPROVAL_URL}/student${suffix}`;

const studentQuery = (target) => {
  const params = new URLSearchParams();
  params.set("user_id", target.userId);
  if (target.date) params.set("date", target.date);
  if (target.testTime) params.set("test_time", target.testTime);
  return params.toString();
};

/**
 * What this candidate's recordings are doing, as the centre sees it: which
 * parts their machine reported as failed, and whether a retry is already open.
 *
 * Read before the approval is given, because "allow a re-download" is a
 * decision about a specific machine that is stuck — not a blanket setting.
 */
export const audioRetryAdminStateUrl = (target) => {
  if (!target) return null;
  if (target.examId) return byTarget(target);
  if (!target.userId) return null;

  return `${byTarget(target)}?${studentQuery(target)}`;
};

/**
 * Let one candidate download their recordings again.
 *
 * Gated on an admin rather than offered in the exam: re-downloading is tens of
 * megabytes, and when a hall's connection is the thing that failed, every
 * machine retrying at once recreates exactly the congestion that broke it.
 * Granting it per candidate keeps that decision the size of the problem.
 */
export const approveAudioRetry = (target, body) =>
  send(
    "post",
    byTarget(target),
    target?.examId
      ? body
      : {
          user_id: target.userId,
          date: target.date,
          // Always sent when the screen knows it, which is what keeps the
          // "several sessions on that date" refusal out of reach.
          test_time: target.testTime,
          ...body,
        }
  );

/**
 * Withdraw an approval. Recordings already downloaded are untouched; this only
 * closes the window for further attempts.
 */
export const revokeAudioRetry = (approvalId) =>
  send("delete", `${APPROVAL_URL}/${approvalId}`);

/**
 * Tell the centre that recordings would not download.
 *
 * Fire and forget, and deliberately not awaited by anything the candidate can
 * see: it exists so the duty admin finds the stuck machine on the booking
 * without being told, and a sitting must never stall because this call did not
 * land.
 */
export const reportAudioFailure = (examUniqueId, parts) =>
  apiClient
    .post(audioFailureUrl(examUniqueId), {
      moduleType: "listening",
      // 1-based: what the candidate and the invigilator both call the part.
      parts: parts.map((index) => index + 1),
    })
    .catch((error) => {
      console.warn("Could not report the audio failure:", error);
    });
