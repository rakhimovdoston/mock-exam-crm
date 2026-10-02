import apiClient from "../services/api";
import { useT } from "../i18n/useT";

// The shift vocabulary, the two error shapes and batch grouping are not
// specific to extra time — both admin exam operations address a sitting the
// same way and answer with the same envelope. They live there because that
// feature needed them first; importing keeps one definition rather than two
// that can drift.
export {
  ALL_SHIFTS,
  TEST_SHIFTS,
  MAX_REASON_LENGTH,
  groupHistoryByBatch,
  parseAmbiguousShifts,
  parseApiError,
  useShiftLabel,
} from "./extraTime";

/**
 * Exam order, which is also the order the backend answers in whatever order
 * the modules were sent. Everything on screen follows it so a grant and its
 * result never list the same two modules differently.
 */
export const REOPEN_MODULES = ["listening", "reading", "writing"];

export const REOPEN_STATUS = {
  OPEN: "OPEN",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

const ADMIN_BASE = "api/v1/admin/exam-section";
const REOPEN_URL = `${ADMIN_BASE}/reopen`;

export const REOPEN_HISTORY_URL = `${REOPEN_URL}/history`;

/** Where the student's own list of reopened sections comes from. */
export const REOPENED_SECTIONS_URL = "api/v1/exam/reopened";

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
 * Reopen sections for everyone in a branch/date/shift.
 *
 * Partial success is the normal outcome, not the exception: a student whose
 * section is already open, or who never submitted that module, comes back
 * under `skipped` with a 200. Callers must read opened_count and skipped_count
 * rather than infer success from the code.
 */
export const reopenForGroup = (body) => send("post", REOPEN_URL, body);

/**
 * Reopen for one student, addressed by who they are and when they sat.
 *
 * This is the path the admin panel normally wants: a table row knows the
 * student, the date and the shift, but never the exam's own id. Unlike the
 * group path a refusal here is a 400, not a `skipped` entry.
 */
export const reopenForStudent = (body) => send("post", `${REOPEN_URL}/student`, body);

/**
 * Reopen one exam id. Only reachable from an exam detail screen, which is the
 * only place the id is on hand.
 */
export const reopenForExam = (examId, body) =>
  send("post", `${REOPEN_URL}/${examId}`, body);

/**
 * Close a section that was opened by mistake.
 *
 * This is NOT an undo: reopening deleted the student's answers and cancelling
 * does not bring them back. It only means "no retake is expected". Every
 * confirmation that leads here has to say so.
 */
export const cancelReopen = (reopenId) =>
  send("delete", `${REOPEN_URL}/${reopenId}/cancel`);

/** Sort any module list into exam order, whatever order it arrived in. */
export const sortModules = (modules) =>
  [...(modules || [])].sort(
    (a, b) => REOPEN_MODULES.indexOf(a) - REOPEN_MODULES.indexOf(b)
  );

/**
 * `opened` and `skipped` carry one entry per (student × module) — six students
 * over two modules is twelve rows. The admin performed one action per student,
 * so the rows are folded back into that shape for display.
 *
 * Keyed by exam id where there is one, because that is what identifies the
 * sitting; user id is the fallback for an entry that carries no exam.
 */
export const groupByStudent = (entries) => {
  const students = new Map();

  (entries || []).forEach((entry) => {
    const key = entry.exam_id ?? entry.user_id ?? entry.student_name;
    const student = students.get(key);

    if (student) {
      student.modules.push(entry.module);
      student.entries.push(entry);
      return;
    }

    students.set(key, {
      key,
      name: entry.student_name,
      testTime: entry.test_time,
      userId: entry.user_id,
      examId: entry.exam_id,
      modules: [entry.module],
      entries: [entry],
    });
  });

  return Array.from(students.values(), (student) => ({
    ...student,
    modules: sortModules(student.modules),
  }));
};

/** "Listening" / "Reading" / "Writing" — one capitalisation, used everywhere. */
export const moduleLabel = (value) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "";

/** Status colour and wording for history rows and for the student's own list. */
export const useReopenStatus = () => {
  const t = useT();

  return (value) => {
    if (value === REOPEN_STATUS.COMPLETED)
      return { color: "green", label: t("sectionReopen.statusCompleted") };
    if (value === REOPEN_STATUS.CANCELLED)
      return { color: "default", label: t("sectionReopen.statusCancelled") };
    return { color: "gold", label: t("sectionReopen.statusOpen") };
  };
};
