import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import SectionReopenResult from "../SectionReopenResult";
import {
  MAX_REASON_LENGTH,
  REOPEN_MODULES,
  TEST_SHIFTS,
  moduleLabel,
  parseAmbiguousShifts,
  parseApiError,
  reopenForExam,
  reopenForStudent,
  sortModules,
  useShiftLabel,
} from "../../utils/sectionReopen";
import { useT } from "../../i18n/useT";

const { Text } = Typography;
const { TextArea } = Input;

const moduleOptions = REOPEN_MODULES.map((value) => ({
  value,
  label: moduleLabel(value),
}));

/**
 * Reopen one student's sections for a retake.
 *
 * `target` says how the student is addressed. `{ userId, date, testTime }` is
 * the normal case — a table row knows all three, so the shift always goes with
 * the request and the server's "several sessions on that date" refusal is
 * never reachable. `{ examId }` is the fallback for an exam detail screen,
 * which is the only place the exam's own id is on hand.
 *
 * Nothing here closes the modal on failure: an admin fixing a shift or a date
 * must not have to retype the modules and the reason.
 */
const SectionReopenModal = ({ open, onClose, studentName, target, onReopened }) => {
  const t = useT();
  const shiftLabel = useShiftLabel();

  const byExamId = Boolean(target?.examId);
  const knownShift = target?.testTime;
  const knownDate = target?.date;

  const [modules, setModules] = useState([]);
  const [reason, setReason] = useState("");
  const [shift, setShift] = useState(knownShift);
  const [date, setDate] = useState(knownDate ? dayjs(knownDate) : dayjs());

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState(null);
  const [formError, setFormError] = useState(null);
  // Set only once the server has told us which sessions actually exist.
  const [ambiguousShifts, setAmbiguousShifts] = useState(null);
  const [result, setResult] = useState(null);

  // Reopening starts clean: a reason left over from the previous student would
  // be written into this one's audit trail.
  useEffect(() => {
    if (!open) return;

    setModules([]);
    setReason("");
    setShift(knownShift);
    setDate(knownDate ? dayjs(knownDate) : dayjs());
    setConfirmOpen(false);
    setSubmitting(false);
    setFieldErrors(null);
    setFormError(null);
    setAmbiguousShifts(null);
    setResult(null);
  }, [open, knownShift, knownDate]);

  // The selector only appears when the caller could not supply the shift, or
  // when the server has just told us the date alone was not enough.
  const needsShift = !byExamId && (!knownShift || Boolean(ambiguousShifts));
  const shiftMissing = needsShift && !shift;
  const canSubmit = modules.length > 0 && !shiftMissing;

  const handleConfirm = async () => {
    // Guarded as well as disabled: a double click must not become two reopens.
    if (submitting || !canSubmit) return;

    setSubmitting(true);
    setFieldErrors(null);
    setFormError(null);

    const body = {
      modules: sortModules(modules),
      reason: reason.trim() || undefined,
    };

    try {
      const data = byExamId
        ? await reopenForExam(target.examId, body)
        : await reopenForStudent({
            user_id: target.userId,
            date: date ? date.format("YYYY-MM-DD") : undefined,
            // Always sent when it is known — that is what keeps the "several
            // sessions" refusal from ever being reachable in practice.
            test_time: shift || undefined,
            ...body,
          });

      setResult(data);
      setConfirmOpen(false);
      toast.success(
        `${data?.opened?.[0]?.student_name || studentName || ""} — ${sortModules(
          data?.modules || modules
        )
          .map(moduleLabel)
          .join(", ")}`
      );
      onReopened?.(data);
    } catch (error) {
      const { status, fields, message } = parseApiError(error);

      setConfirmOpen(false);

      if (fields) {
        setFieldErrors(fields);
        return;
      }

      if (status === 403) {
        setFormError({ type: "error", message: t("sectionReopen.noPermission") });
        return;
      }

      // Checked before the message is read: the "no exam on that date" refusal
      // also names a shift in parentheses, and reading it as an ambiguity would
      // ask for a shift that was never the problem.
      if (status === 404) {
        setFormError({
          type: "error",
          message: message || t("sectionReopen.notFound"),
        });
        return;
      }

      // The date matched more than one session. The server names them, so the
      // selector offers exactly those rather than all three.
      const shifts = status === 400 ? parseAmbiguousShifts(message) : [];
      if (shifts.length) {
        setAmbiguousShifts(shifts);
        setShift(undefined);
        setFormError({ type: "warning", message });
        return;
      }

      setFormError({
        type: "error",
        message: message || t("sectionReopen.failed"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const shiftChoices = (ambiguousShifts || TEST_SHIFTS).map((value) => ({
    value,
    label: shiftLabel(value),
  }));

  return (
    <>
      <Modal
        title={t("sectionReopen.singleTitle")}
        open={open}
        onCancel={onClose}
        closable={!submitting}
        maskClosable={!submitting}
        footer={
          result
            ? [
                <Button key="done" type="primary" onClick={onClose}>
                  {t("common.close")}
                </Button>,
              ]
            : [
                <Button key="cancel" onClick={onClose} disabled={submitting}>
                  {t("common.cancel")}
                </Button>,
                <Button
                  key="submit"
                  type="primary"
                  danger
                  loading={submitting}
                  disabled={!canSubmit}
                  onClick={() => setConfirmOpen(true)}
                >
                  {t("sectionReopen.submit")}
                </Button>,
              ]
        }
      >
        {/* Fixed context: who and when, never asked for again. */}
        <Space wrap size={[8, 8]} style={{ marginBottom: 4 }}>
          {studentName && <Text strong>{studentName}</Text>}
          {!byExamId && knownDate && (
            <Tag color="red">{dayjs(knownDate).format("DD.MM.YYYY")}</Tag>
          )}
          {!byExamId && knownShift && (
            <Tag color="green">{shiftLabel(knownShift)}</Tag>
          )}
        </Space>

        {result ? (
          <div style={{ marginTop: 16 }}>
            <SectionReopenResult result={result} />
          </div>
        ) : (
          <>
            <Form layout="vertical" style={{ marginTop: 16 }}>
              {!byExamId && !knownDate && (
                <Form.Item
                  label={t("sectionReopen.date")}
                  validateStatus={fieldErrors?.date ? "error" : undefined}
                  help={fieldErrors?.date}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    value={date}
                    allowClear={false}
                    onChange={(value) => setDate(value || dayjs())}
                  />
                </Form.Item>
              )}

              {needsShift && (
                <Form.Item
                  label={t("sectionReopen.shift")}
                  required
                  validateStatus={
                    fieldErrors?.test_time || shiftMissing ? "error" : undefined
                  }
                  help={
                    fieldErrors?.test_time ||
                    (shiftMissing ? t("sectionReopen.shiftRequired") : undefined)
                  }
                >
                  <Select
                    value={shift}
                    placeholder={t("sectionReopen.shiftRequired")}
                    onChange={setShift}
                    options={shiftChoices}
                  />
                </Form.Item>
              )}

              {/* Several modules can fail in one sitting — a broken audio and a
                  lost essay are one incident, so they are one action. */}
              <Form.Item
                label={t("sectionReopen.modules")}
                required
                validateStatus={
                  fieldErrors?.modules || modules.length === 0
                    ? "error"
                    : undefined
                }
                help={
                  fieldErrors?.modules ||
                  (modules.length === 0
                    ? t("sectionReopen.modulesRequired")
                    : t("sectionReopen.modulesHint"))
                }
              >
                <Checkbox.Group
                  options={moduleOptions}
                  value={modules}
                  onChange={setModules}
                />
              </Form.Item>

              <Form.Item
                label={t("sectionReopen.reason")}
                validateStatus={fieldErrors?.reason ? "error" : undefined}
                help={fieldErrors?.reason}
                style={{ marginBottom: 12 }}
              >
                <TextArea
                  rows={3}
                  value={reason}
                  maxLength={MAX_REASON_LENGTH}
                  showCount
                  placeholder={t("sectionReopen.reasonPlaceholder")}
                  onChange={(event) => setReason(event.target.value)}
                />
              </Form.Item>
            </Form>

            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <Alert
                type="warning"
                showIcon
                message={t("sectionReopen.destructiveTitle")}
                description={t("sectionReopen.destructiveBody")}
              />

              {formError && (
                <Alert
                  type={formError.type}
                  showIcon
                  message={formError.message}
                />
              )}

              {!reason.trim() && (
                <Alert
                  type="warning"
                  showIcon
                  message={t("sectionReopen.reasonWarning")}
                />
              )}
            </Space>
          </>
        )}
      </Modal>

      <Modal
        open={confirmOpen}
        title={t("sectionReopen.confirmTitle")}
        okText={t("sectionReopen.confirmYes")}
        okButtonProps={{ danger: true }}
        cancelText={t("common.cancel")}
        confirmLoading={submitting}
        maskClosable={!submitting}
        onCancel={() => setConfirmOpen(false)}
        onOk={handleConfirm}
      >
        <Space direction="vertical" size={8}>
          <Text>
            {[
              studentName,
              !byExamId && date ? date.format("DD.MM.YYYY") : null,
              !byExamId && shift ? shiftLabel(shift) : null,
            ]
              .filter(Boolean)
              .join("  /  ")}
          </Text>
          <Space size={6} wrap>
            {sortModules(modules).map((module) => (
              <Tag key={module} color="volcano">
                {moduleLabel(module)}
              </Tag>
            ))}
          </Space>
          <Text type="danger">{t("sectionReopen.destructiveBody")}</Text>
          {reason.trim() && <Text type="secondary">{reason.trim()}</Text>}
        </Space>
      </Modal>
    </>
  );
};

export default SectionReopenModal;
