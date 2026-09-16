import React from "react";
import { Button, Modal, Result } from "antd";

/**
 * Shown when the server reports the module as finished — usually because the
 * student came back to a section they already submitted.
 *
 * It covers the paper rather than switching every input to read-only: the
 * answer widgets are spread across the editor elements, and one blocking layer
 * is both simpler and harder to get half-wrong than a flag threaded through all
 * of them. The only way out is back to the exam hub.
 */
const SectionFinishedModal = ({ open, onLeave }) => (
  <Modal
    open={open}
    closable={false}
    maskClosable={false}
    keyboard={false}
    centered
    footer={[
      <Button key="leave" type="primary" size="large" onClick={onLeave}>
        Back to your exam
      </Button>,
    ]}
  >
    <Result
      status="success"
      title="This section is already finished"
      subTitle="Your answers have been submitted and can no longer be changed."
    />
  </Modal>
);

export default SectionFinishedModal;
