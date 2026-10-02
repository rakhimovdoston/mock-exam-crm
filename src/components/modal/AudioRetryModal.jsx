import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Descriptions,
  Form,
  Input,
  Modal,
  Skeleton,
  Space,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import useApiRequest from "../../hooks/useApiRequest";
import { formatDateTime } from "../../utils/dateUtils";
import {
  APPROVAL_STATUS,
  MAX_REASON_LENGTH,
  approveAudioRetry,
  audioRetryAdminStateUrl,
  parseAmbiguousShifts,
  parseApiError,
  revokeAudioRetry,
  useShiftLabel,
} from "../../utils/audioRetry";
import { useT } from "../../i18n/useT";

const { Text } = Typography;
const { TextArea } = Input;

/**
 * Let one candidate download their Listening recordings again.
 *
 * Per booking, never per session: the machine that got stuck is the one that
 * needs the window opened, and a whole hall re-fetching tens of megabytes is
 * the congestion that broke the first attempt in the first place.
 *
 * Opens by reading what that machine actually reported, so the approval is
 * given against a known failure rather than on the invigilator's word.
 *
 * Nothing here closes the modal on failure: an admin fixing a reason must not
 * have to reopen it and lose what they typed.
 */
const AudioRetryModal = ({ open, onClose, studentName, target, onChanged }) => {
  const t = useT();
  const shiftLabel = useShiftLabel();

  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState(null);
  const [formError, setFormError] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const url = useMemo(() => audioRetryAdminStateUrl(target), [target]);
  const { data, loading } = useApiRequest(open ? url : null, [
    open,
    url,
    refresh,
  ]);

  const state = data?.data;
  const approvalId = state?.approval_id ?? null;
  const isActive = Boolean(approvalId) && state?.status === APPROVAL_STATUS.ACTIVE;
  const reportedParts = state?.reported_parts || [];

  // Reopening starts clean: a reason left over from the previous candidate
  // would be written into this one's audit trail.
  useEffect(() => {
    if (!open) return;

    setReason("");
    setSubmitting(false);
    setFieldErrors(null);
    setFormError(null);
  }, [open, target]);

  const handleError = (error) => {
    const { status, fields, message } = parseApiError(error);

    if (fields) {
      setFieldErrors(fields);
      return;
    }

    if (status === 403) {
      setFormError({ type: "error", message: t("audioRetry.noPermission") });
      return;
    }

    // Checked before the message is read: the "no exam on that date" refusal
    // also names a shift in parentheses, and reading it as an ambiguity would
    // ask for a session that was never the problem.
    if (status === 404) {
      setFormError({
        type: "error",
        message: message || t("audioRetry.notFound"),
      });
      return;
    }

    const shifts = status === 400 ? parseAmbiguousShifts(message) : [];
    if (shifts.length) {
      setFormError({ type: "warning", message });
      return;
    }

    setFormError({ type: "error", message: message || t("audioRetry.failed") });
  };

  const handleApprove = async () => {
    // Guarded as well as disabled: a double click must not open two windows.
    if (submitting) return;

    setSubmitting(true);
    setFieldErrors(null);
    setFormError(null);

    try {
      await approveAudioRetry(target, { reason: reason.trim() || undefined });
      toast.success(t("audioRetry.approved"));
      setRefresh((value) => value + 1);
      onChanged?.();
    } catch (error) {
      handleError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    if (submitting || !approvalId) return;

    setSubmitting(true);
    setFormError(null);

    try {
      await revokeAudioRetry(approvalId);
      toast.success(t("audioRetry.revoked"));
      setRefresh((value) => value + 1);
      onChanged?.();
    } catch (error) {
      handleError(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={t("audioRetry.title")}
      open={open}
      onCancel={onClose}
      closable={!submitting}
      maskClosable={!submitting}
      footer={[
        <Button key="close" onClick={onClose} disabled={submitting}>
          {t("common.close")}
        </Button>,
        isActive ? (
          <Button
            key="revoke"
            danger
            loading={submitting}
            onClick={handleRevoke}
          >
            {t("audioRetry.revoke")}
          </Button>
        ) : (
          <Button
            key="approve"
            type="primary"
            loading={submitting}
            onClick={handleApprove}
          >
            {t("audioRetry.submit")}
          </Button>
        ),
      ]}
    >
      {/* Fixed context: who and when, never asked for again. */}
      <Space wrap size={[8, 8]} style={{ marginBottom: 12 }}>
        {studentName && <Text strong>{studentName}</Text>}
        {target?.date && (
          <Tag color="red">{dayjs(target.date).format("DD.MM.YYYY")}</Tag>
        )}
        {target?.testTime && <Tag color="green">{shiftLabel(target.testTime)}</Tag>}
      </Space>

      {loading ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : (
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Descriptions size="small" column={1} bordered>
            <Descriptions.Item label={t("audioRetry.reportedParts")}>
              {reportedParts.length > 0 ? (
                <Space size={4} wrap>
                  {reportedParts.map((part) => (
                    <Tag color="red" key={part} style={{ marginInlineEnd: 0 }}>
                      {t("audioRetry.part")} {part}
                    </Tag>
                  ))}
                </Space>
              ) : (
                // Not an error: an admin may open the window before the machine
                // has given up, and saying "none reported" is the honest state.
                <Text type="secondary">{t("audioRetry.noneReported")}</Text>
              )}
            </Descriptions.Item>

            {state?.reported_at && (
              <Descriptions.Item label={t("audioRetry.reportedAt")}>
                {formatDateTime(state.reported_at)}
              </Descriptions.Item>
            )}

            <Descriptions.Item label={t("audioRetry.currentState")}>
              {isActive ? (
                <Space direction="vertical" size={2}>
                  <Tag color="green">{t("audioRetry.statusActive")}</Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {[state.approved_by_name, formatDateTime(state.created_at)]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </Space>
              ) : (
                <Text type="secondary">{t("audioRetry.statusNone")}</Text>
              )}
            </Descriptions.Item>
          </Descriptions>

          {isActive ? (
            <Alert
              type="info"
              showIcon
              message={t("audioRetry.activeHint")}
              description={t("audioRetry.revokeWarning")}
            />
          ) : (
            <>
              <Form layout="vertical" style={{ marginBottom: 0 }}>
                <Form.Item
                  label={t("audioRetry.reason")}
                  validateStatus={fieldErrors?.reason ? "error" : undefined}
                  help={fieldErrors?.reason}
                  style={{ marginBottom: 0 }}
                >
                  <TextArea
                    rows={3}
                    value={reason}
                    maxLength={MAX_REASON_LENGTH}
                    showCount
                    placeholder={t("audioRetry.reasonPlaceholder")}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </Form.Item>
              </Form>

              <Alert
                type="warning"
                showIcon
                message={t("audioRetry.loadWarningTitle")}
                description={t("audioRetry.loadWarningBody")}
              />
            </>
          )}

          {formError && (
            <Alert type={formError.type} showIcon message={formError.message} />
          )}
        </Space>
      )}
    </Modal>
  );
};

export default AudioRetryModal;
