import apiClient from "../services/api";
import { useT } from "../i18n/useT";

export const ALL_SHIFTS = "all";

export const EXTRA_TIME_MODULES = ["listening", "reading", "writing"];

/**
 * The two levels time can be granted at. The API calls this `type`.
 *
 * MODULE moves one module's own timer; OVERALL moves the whole sitting's
 * deadline and has nothing to do with any single module — which is why it takes
 * no module and only a full admin may grant it.
 */
export const TIME_TYPE = { MODULE: "module", OVERALL: "exam" };
export const TEST_SHIFTS = ["morning", "afternoon", "evening"];

/** One-tap amounts for the common cases; the field still accepts anything. */
export const QUICK_MINUTES = [5, 10, 15, 30];
export const MIN_MINUTES = 1;
export const MAX_MINUTES = 180;
export const MAX_REASON_LENGTH = 500;

const ADMIN_BASE = "api/v1/admin/exam-time";
const MODULE_URL = `${ADMIN_BASE}/extra-time`;
const OVERALL_URL = `${ADMIN_BASE}/exam-extra-time`;

export const HISTORY_URL = `${MODULE_URL}/history`;

/**
 * The envelope carries its own `code`, and the backend also answers with real
 * HTTP errors — a refused grant can arrive either way. Both become a thrown
 * error here, with the payload attached, so callers have a single path.
 */
const post = async (url, body) => {
  const response = await apiClient.post(url, body);

  if (response?.success === false || response?.code !== 200) {
    const error = new Error(response?.message || "");
    error.apiPayload = response;
    throw error;
  }

  return response.data;
};

/**
 * Extra time for everyone in a branch/date/shift.
 *
 * Partial success is normal: students whose module is already finished, or a
 * repeat of the same request within a minute, come back under `skipped` with a
 * 200 — so the caller must read granted_count and skipped_count, not the code.
 */
export const grantModuleTimeForGroup = (body) => post(MODULE_URL, body);

/**
 * Extra time for one student, addressed by who they are and when they sat.
 *
 * This is the path the admin panel normally wants: it knows the student, the
 * date and the shift from the row it was opened from, but never the exam's own
 * id. Like the single-exam path, a refusal is a 400 rather than a `skipped`.
 */
export const grantModuleTimeForStudent = (body) => post(`${MODULE_URL}/student`, body);

/**
 * Extra time for one exam id. Only reachable from an exam detail screen, where
 * the id is actually on hand.
 */
export const grantModuleTimeForExam = (examId, body) =>
  post(`${MODULE_URL}/${examId}`, body);

/**
 * Overall time for everyone in a branch/date/shift. Admin only — the backend
 * refuses a branch admin with a 403, and the UI never offers it to them.
 *
 * A sitting that had already run out of time reopens when the grant covers how
 * late it is; if it does not, the sitting stays closed and nothing visible
 * happens, which is the part admins find confusing.
 */
export const grantOverallTimeForGroup = (body) => post(OVERALL_URL, body);

/** Overall time for one student, addressed by who they are and when they sat. */
export const grantOverallTimeForStudent = (body) =>
  post(`${OVERALL_URL}/student`, body);

/**
 * The "several sessions on that date" refusal names them in parentheses:
 *   "... bir nechta sessiya bor (morning, evening). test_time ni ko'rsating."
 *
 * Pulling them out lets the shift selector offer exactly the sessions that
 * exist, instead of asking the admin to guess.
 *
 * Callers MUST gate this on a 400 first: the 404 ("no exam on that date") names
 * a shift in parentheses too, and would otherwise be mistaken for an ambiguity.
 */
export const parseAmbiguousShifts = (message) => {
  const match = /\(([^)]+)\)/.exec(message || "");
  if (!match) return [];

  return match[1]
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter((part) => TEST_SHIFTS.includes(part));
};

/**
 * The backend's duplicate-guard refusal. Matched on the message because a plain
 * 400 is all that distinguishes it; a miss just falls through to the generic
 * error path, so a reworded message costs reassurance, never correctness.
 */
export const isDuplicateRequest = (message) =>
  /allaqachon yuborilgan/i.test(message || "");

/** "Module time" / "Overall time", for headings, tags and filters. */
export const useTimeTypeLabel = () => {
  const t = useT();

  return (value) =>
    value === TIME_TYPE.OVERALL
      ? t("extraTime.overallTime")
      : t("extraTime.moduleTime");
};

/** Shared label for a shift value, including the "all shifts" pseudo-value. */
export const useShiftLabel = () => {
  const t = useT();

  return (value) => {
    if (value === ALL_SHIFTS) return t("extraTime.allShifts");
    if (TEST_SHIFTS.includes(value)) return t(`common.${value}`);
    return value || "-";
  };
};

/**
 * Flatten both failure shapes into one.
 *
 * `fields` is the per-field map @Valid sends as "Validations errors"; it
 * belongs under the inputs rather than in a toast, so it is kept separate.
 */
export const parseApiError = (error) => {
  const payload = error?.apiPayload ?? error?.response?.data;
  const status = error?.response?.status ?? payload?.code;
  const fields =
    payload?.error && typeof payload.error === "object" ? payload.error : null;

  return { status, fields, message: payload?.message || "" };
};

/**
 * History rows written by one group grant share a batch_id. Grouping them turns
 * twenty-three identical rows into a single "15 minutes × 23 students" entry,
 * which is how the action was actually performed.
 *
 * Grouping is per page: the server paginates rows, so a very large batch can
 * still straddle a page boundary.
 */
export const groupHistoryByBatch = (rows) => {
  const groups = new Map();

  (rows || []).forEach((row) => {
    // A row with no batch id stands on its own.
    const key = row.batch_id || `row-${row.id}`;
    const group = groups.get(key);

    if (group) {
      group.rows.push(row);
      return;
    }

    groups.set(key, {
      key,
      batchId: row.batch_id || null,
      first: row,
      rows: [row],
    });
  });

  return Array.from(groups.values());
};
