import React from "react";
import { Button } from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  LoadingOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";

const ICONS = {
  ready: <CheckCircleFilled className="exam-audio-row__icon exam-audio-row__icon--ready" />,
  downloading: <LoadingOutlined className="exam-audio-row__icon" />,
  failed: <CloseCircleFilled className="exam-audio-row__icon exam-audio-row__icon--failed" />,
  none: <MinusCircleOutlined className="exam-audio-row__icon exam-audio-row__icon--none" />,
};

const label = (part) => {
  if (part.state === "ready") return "Ready";
  if (part.state === "failed") return "Failed";
  if (part.state === "none") return "No recording";
  return `${Math.round((part.progress ?? 0) * 100)}%`;
};

/**
 * What the candidate's machine has actually managed to download.
 *
 * Shown inside the exam's settings menu, and only for Listening — it is the
 * one module whose recordings can fail in a way the candidate can see, and a
 * silent download is exactly the thing that makes a stalled hall look like a
 * broken exam.
 *
 * Downloading again is deliberately not a button the candidate can press on
 * their own. The usual cause is the hall's connection, and twenty machines
 * re-fetching tens of megabytes at once is the same congestion that broke the
 * first attempt — so an admin opens the window for the session, and only then
 * does the button appear here.
 */
const AudioStatusPanel = ({
  parts,
  allowed,
  approvedByName,
  onRetry,
  retrying,
}) => {
  const failed = parts.filter((part) => part.state === "failed");

  return (
    <div className="exam-audio">
      <span className="exam-audio__title">Recordings</span>

      <ul className="exam-audio__list">
        {parts.map((part) => (
          <li key={part.label} className="exam-audio-row">
            {ICONS[part.state]}
            <span className="exam-audio-row__name">{part.label}</span>
            <span
              className={
                part.state === "failed"
                  ? "exam-audio-row__state exam-audio-row__state--failed"
                  : "exam-audio-row__state"
              }
            >
              {label(part)}
            </span>
          </li>
        ))}
      </ul>

      {failed.length > 0 && (
        <div className="exam-audio__notice">
          {allowed ? (
            <>
              <p className="exam-audio__text">
                Your supervisor has allowed the recordings to be downloaded
                again
                {approvedByName ? ` (${approvedByName})` : ""}.
              </p>
              <Button
                type="primary"
                size="small"
                block
                loading={retrying}
                onClick={onRetry}
              >
                Download again
              </Button>
            </>
          ) : (
            <p className="exam-audio__text">
              {failed.length === 1
                ? `${failed[0].label} could not be downloaded.`
                : `${failed.length} recordings could not be downloaded.`}{" "}
              Tell your supervisor — they can allow a retry for this session.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AudioStatusPanel;
