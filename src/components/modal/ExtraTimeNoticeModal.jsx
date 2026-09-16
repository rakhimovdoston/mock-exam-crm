import React, { useState } from "react";
import { Alert, Button, Modal, Result } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";

/**
 * Shown when the invigilator has granted extra time.
 *
 * The page has to be reloaded to pick up the new paper state, and that reload
 * would throw away anything not yet on the server — in Writing that can be
 * forty minutes of typing. So the draft is saved first and the reload only
 * happens once that save has succeeded; if it fails, nothing is reloaded and
 * the student is offered another attempt.
 */
const ExtraTimeNoticeModal = ({ open, message, saveDraft }) => {
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleReload = async () => {
    if (saving) return;

    setSaving(true);
    setFailed(false);

    try {
      await saveDraft?.();
    } catch (error) {
      console.error("Could not save before reloading:", error);
      setFailed(true);
      setSaving(false);
      return;
    }

    window.location.reload();
  };

  return (
    <Modal
      open={open}
      closable={false}
      maskClosable={false}
      keyboard={false}
      centered
      footer={[
        <Button
          key="reload"
          type="primary"
          size="large"
          loading={saving}
          onClick={handleReload}
        >
          {failed ? "Try again" : "Refresh page"}
        </Button>,
      ]}
    >
      <Result
        icon={<ClockCircleOutlined style={{ color: "var(--exam-accent)" }} />}
        title="Extra time has been added"
        subTitle={message}
      />

      {failed && (
        <Alert
          type="error"
          showIcon
          message="Your answers could not be saved, so the page was not refreshed."
          description="Check your connection and try again. Nothing has been lost."
        />
      )}
    </Modal>
  );
};

export default ExtraTimeNoticeModal;
