import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  DatePicker,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Segmented,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import ExtraTimeResult from "../ExtraTimeResult";
import {
  EXTRA_TIME_MODULES,
  MAX_MINUTES,
  MAX_REASON_LENGTH,
  MIN_MINUTES,
  QUICK_MINUTES,
  TEST_SHIFTS,
  TIME_TYPE,
  grantModuleTimeForExam,
  grantModuleTimeForStudent,
  grantOverallTimeForStudent,
  isDuplicateRequest,
  parseAmbiguousShifts,
  parseApiError,
  useShiftLabel,
  useTimeTypeLabel,
} from "../../utils/extraTime";
import { Role } from "../../data/role";
import { checkRole } from "../../utils/roleUtils";
import { useT } from "../../i18n/useT";

const { Text } = Typography;
const { TextArea } = Input;

const DEFAULT_MINUTES = 15;

const moduleOptions = EXTRA_TIME_MODULES.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}));

/**
 * Extra time for one student.
 *
 * `target` says how the student is addressed. `{ userId, date, testTime }` is
 * the normal case — a table row knows all three, so the shift always goes with
 * the request and the server's "several sessions on that date" refusal is never
 * reachable. `{ examId }` is the fallback for an exam detail screen, which is
 * the only place the exam's own id is on hand.
 *
 * Nothing here closes the modal on failure: an admin fixing a shift or a date
 * must not have to retype the minutes and the reason.
 */
const ExtraTimeModal = ({ open, onClose, studentName, target, onGranted }) => {
  const t = useT();
  const shiftLabel = useShiftLabel();
  const timeTypeLabel = useTimeTypeLabel();

  const { user } = useSelector((state) => state.auth);
  const isAdmin = checkRole(user?.roles || [], Role.ROLE_ADMIN);

  const byExamId = Boolean(target?.examId);
  const knownShift = target?.testTime;
  const knownDate = target?.date;

  const [timeType, setTimeType] = useState(TIME_TYPE.MODULE);
  const [module, setModule] = useState(EXTRA_TIME_MODULES[0]);
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES);
  const [reason, setReason] = useState("");
  const [shift, setShift] = useState(knownShift);
  const [date, setDate] = useState(knownDate ? dayjs(knownDate) : dayjs());

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

    setTimeType(TIME_TYPE.MODULE);
    setModule(EXTRA_TIME_MODULES[0]);
    setMinutes(DEFAULT_MINUTES);
    setReason("");
    setShift(knownShift);
    setDate(knownDate ? dayjs(knownDate) : dayjs());
    setSubmitting(false);
    setFieldErrors(null);
    setFormError(null);
    setAmbiguousShifts(null);
    setResult(null);
  }, [open, knownShift, knownDate]);

  // Only a full admin may move the whole sitting, and there is no overall
  // endpoint addressed by exam id — so the switch is hidden in both cases
  // rather than shown and then refused with a 403.
  const canChooseLevel = isAdmin && !byExamId;
  const isOverall = canChooseLevel && timeType === TIME_TYPE.OVERALL;

  const minutesValid =
    Number.isInteger(minutes) &&
    minutes >= MIN_MINUTES &&
    minutes <= MAX_MINUTES;

  // The selector only appears when the caller could not supply the shift, or
  // when the server has just told us the date alone was not enough.
  const needsShift = !byExamId && (!knownShift || Boolean(ambiguousShifts));
  const shiftMissing = needsShift && !shift;
  const canSubmit = minutesValid && !shiftMissing;

  const addMinutes = (amount) =>
    setMinutes((current) =>
      Math.min(MAX_MINUTES, (Number.isFinite(current) ? current : 0) + amount)
    );

  const announce = (data) => {
    const granted = data?.granted?.[0];
    const total = granted?.total_extra_minutes;
    const who = granted?.student_name || studentName || "";
    const unit = t("extraTime.minutes").toLowerCase();
    const what = isOverall ? timeTypeLabel(TIME_TYPE.OVERALL) : module;

    toast.success(
      `${who} — ${what} +${minutes} ${unit}` +
        (total != null ? ` (${t("extraTime.totalExtra")}: ${total})` : "")
    );
  };

  const handleSubmit = async () => {
    // Guarded as well as disabled: a double click must not become two grants.
    if (submitting || !canSubmit) return;

    setSubmitting(true);
    setFieldErrors(null);
    setFormError(null);

    try {
      const data = byExamId
        ? await grantModuleTimeForExam(target.examId, {
            module,
            minutes,
            reason: reason.trim() || undefined,
          })
        : await (
            isOverall ? grantOverallTimeForStudent : grantModuleTimeForStudent
          )({
            user_id: target.userId,
            date: date ? date.format("YYYY-MM-DD") : undefined,
            // Always sent when it is known — that is what keeps the "several
            // sessions" refusal from ever being reachable in practice.
            test_time: shift || undefined,
            // The overall endpoint takes no module, and sending one would be
            // meaningless: it moves the whole sitting.
            ...(isOverall ? {} : { module }),
            minutes,
            reason: reason.trim() || undefined,
          });

      setResult(data);
      announce(data);
      onGranted?.(data);
    } catch (error) {
      const { status, fields, message } = parseApiError(error);

      if (fields) {
        setFieldErrors(fields);
        return;
      }

      if (status === 403) {
        setFormError({ type: "error", message: t("extraTime.noPermission") });
        return;
      }

      // Checked before the message is read: the "no exam on that date" refusal
      // also names a shift in parentheses, and reading it as an ambiguity would
      // ask for a shift that was never the problem.
      if (status === 404) {
        setFormError({
          type: "error",
          message: message || t("extraTime.notFound"),
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

      if (isDuplicateRequest(message)) {
        setFormError({ type: "info", message: t("extraTime.alreadyGranted") });
        return;
      }

      setFormError({
        type: "error",
        message: message || t("extraTime.failed"),
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
    <Modal
      title={`${t("extraTime.singleTitle")} · ${timeTypeLabel(
        isOverall ? TIME_TYPE.OVERALL : TIME_TYPE.MODULE
      )}`}
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
                loading={submitting}
                disabled={!canSubmit}
                onClick={handleSubmit}
              >
                {t("extraTime.add")}
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
          <ExtraTimeResult result={result} />
        </div>
      ) : (
        <>
          <Form layout="vertical" style={{ marginTop: 16 }}>
            {canChooseLevel && (
              <Form.Item label={t("extraTime.level")}>
                <Segmented
                  block
                  value={timeType}
                  onChange={setTimeType}
                  options={[
                    {
                      value: TIME_TYPE.MODULE,
                      label: timeTypeLabel(TIME_TYPE.MODULE),
                    },
                    {
                      value: TIME_TYPE.OVERALL,
                      label: timeTypeLabel(TIME_TYPE.OVERALL),
                    },
                  ]}
                />
              </Form.Item>
            )}

            {!byExamId && !knownDate && (
              <Form.Item
                label={t("extraTime.date")}
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
                label={t("extraTime.shift")}
                required
                validateStatus={
                  fieldErrors?.test_time || shiftMissing ? "error" : undefined
                }
                help={
                  fieldErrors?.test_time ||
                  (shiftMissing ? t("extraTime.shiftRequired") : undefined)
                }
              >
                <Select
                  value={shift}
                  placeholder={t("extraTime.shiftRequired")}
                  onChange={setShift}
                  options={shiftChoices}
                />
              </Form.Item>
            )}

            {/* Overall time belongs to the sitting, not to any one module. */}
            {!isOverall && (
              <Form.Item
                label={t("extraTime.module")}
                validateStatus={fieldErrors?.module ? "error" : undefined}
                help={fieldErrors?.module}
              >
                <Segmented
                  block
                  value={module}
                  options={moduleOptions}
                  onChange={setModule}
                />
              </Form.Item>
            )}

            <Form.Item
              label={t("extraTime.minutes")}
              validateStatus={
                fieldErrors?.minutes || !minutesValid ? "error" : undefined
              }
              help={
                fieldErrors?.minutes ||
                (minutesValid
                  ? t("extraTime.minutesHint")
                  : t("extraTime.minutesRequired"))
              }
            >
              <Flex gap={8} wrap="wrap">
                <InputNumber
                  min={MIN_MINUTES}
                  max={MAX_MINUTES}
                  precision={0}
                  value={minutes}
                  onChange={setMinutes}
                  style={{ width: 110 }}
                />
                {QUICK_MINUTES.map((amount) => (
                  <Button key={amount} onClick={() => addMinutes(amount)}>
                    +{amount}
                  </Button>
                ))}
              </Flex>
            </Form.Item>

            <Form.Item
              label={t("extraTime.reason")}
              validateStatus={fieldErrors?.reason ? "error" : undefined}
              help={fieldErrors?.reason}
              style={{ marginBottom: 12 }}
            >
              <TextArea
                rows={3}
                value={reason}
                maxLength={MAX_REASON_LENGTH}
                showCount
                placeholder={t("extraTime.reasonPlaceholder")}
                onChange={(event) => setReason(event.target.value)}
              />
            </Form.Item>
          </Form>

          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            {isOverall && (
              <Alert
                type="info"
                showIcon
                message={t("extraTime.overallHint")}
                description={t("extraTime.overallReopenNote")}
              />
            )}

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
                message={t("extraTime.reasonWarning")}
              />
            )}
          </Space>
        </>
      )}
    </Modal>
  );
};

export default ExtraTimeModal;
