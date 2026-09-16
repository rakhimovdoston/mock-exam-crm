import React from "react";
import {
  CreditCardOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  HourglassOutlined,
  SoundOutlined,
  StopOutlined,
} from "@ant-design/icons";

/**
 * The six things that wait on a person, in the order one would work through
 * them: what is broken first, then what is unmarked, then what is unpaid.
 *
 * Shared by the dashboard block and the page it links to, so the two can never
 * disagree about what the queue contains or how urgent a part of it is.
 *
 * `severity` drives a semantic colour that is deliberately separate from the
 * chart accent, and every block carries an icon and a label — the state is
 * never signalled by colour alone.
 */
export const ATTENTION_BLOCKS = [
  {
    key: "failedExams",
    icon: <StopOutlined />,
    severity: "critical",
    to: "/dashboard/contest?status=FAILED",
  },
  {
    key: "stuckExams",
    icon: <HourglassOutlined />,
    severity: "critical",
    to: "/dashboard/contest?status=PROCESS",
  },
  {
    key: "writingUnchecked",
    icon: <EditOutlined />,
    severity: "warning",
    to: "/dashboard/results",
  },
  {
    key: "speakingUnscored",
    icon: <SoundOutlined />,
    severity: "warning",
    to: "/dashboard/speaking",
  },
  {
    key: "paymentExpired",
    icon: <ExclamationCircleOutlined />,
    severity: "serious",
    to: "/dashboard/contest",
  },
  {
    key: "paymentPending",
    icon: <CreditCardOutlined />,
    severity: "neutral",
    to: "/dashboard/contest",
  },
];

/** Semantic colour per severity, resolved against the live antd tokens. */
export const severityColor = (token) => ({
  critical: token.colorError,
  serious: token.colorWarning,
  warning: token.colorWarning,
  neutral: token.colorTextSecondary,
});
