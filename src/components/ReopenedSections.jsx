import React, { useState } from "react";
import { Button, Tag, Typography, theme } from "antd";
import {
  AudioOutlined,
  EditOutlined,
  ExclamationCircleFilled,
  ReadOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import useApiRequest from "../hooks/useApiRequest";
import { REOPENED_SECTIONS_URL, moduleLabel } from "../utils/sectionReopen";
import { ensureMicrophoneAccess } from "../utils/microphone";
import { enterFullScreen } from "../utils/documentUtils";

const { Text, Title } = Typography;

const MODULE_ICONS = {
  listening: <AudioOutlined />,
  reading: <ReadOutlined />,
  writing: <EditOutlined />,
};

/**
 * Sections a supervisor has opened for this candidate to sit again.
 *
 * Drawn only when there is something to sit: an empty list is the normal state
 * and an empty panel explaining that nothing was reopened would be noise on
 * every other candidate's screen.
 *
 * It renders nothing while loading and nothing on failure, because it is an
 * addition to a page that works without it — a candidate with no retake must
 * never be blocked from starting a test by this request.
 */
const ReopenedSections = () => {
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(null);

  const { data } = useApiRequest(REOPENED_SECTIONS_URL, []);

  // The list is the envelope's payload, but the endpoint is documented as a
  // bare array — accepted either way rather than depending on which it is.
  const payload = data?.data ?? data;
  const sections = Array.isArray(payload) ? payload : [];

  if (sections.length === 0) return null;

  const handleStart = async (section) => {
    if (starting) return;
    setStarting(section.reopenId);

    try {
      // A Listening retake needs the headset proved just as a first sitting
      // does — the audio still plays only once.
      if (section.moduleType === "listening") {
        const allowed = await ensureMicrophoneAccess();
        if (!allowed) return;
      }

      enterFullScreen();
      navigate(`/${section.moduleType}/${section.examUniqueId}`);
    } finally {
      setStarting(null);
    }
  };

  return (
    <div
      style={{
        background: token.colorWarningBg,
        border: `1px solid ${token.colorWarningBorder}`,
        borderRadius: 16,
        padding: "18px 20px",
        marginBottom: "clamp(10px, 1.8vh, 16px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 4,
        }}
      >
        <ExclamationCircleFilled
          style={{ color: token.colorWarning, fontSize: 18 }}
        />
        <Title level={5} style={{ margin: 0 }}>
          Sections reopened for you
        </Title>
      </div>

      <Text type="secondary" style={{ fontSize: 13 }}>
        A supervisor has opened these sections again. Your previous answers for
        them were cleared, and the timer starts fresh when you open one.
      </Text>

      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        {sections.map((section) => (
          <div
            key={section.reopenId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
              background: token.colorBgContainer,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: 12,
              padding: "12px 14px",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "0 0 auto",
                width: 38,
                height: 38,
                borderRadius: 11,
                fontSize: 17,
                color: token.colorWarning,
                background: token.colorWarningBg,
              }}
            >
              {MODULE_ICONS[section.moduleType]}
            </span>

            <div style={{ flex: 1, minWidth: 140 }}>
              <Text strong style={{ fontSize: 15 }}>
                {moduleLabel(section.moduleType)}
              </Text>
              <div style={{ marginTop: 2 }}>
                <Text type="secondary" style={{ fontSize: 12.5 }}>
                  {dayjs(section.testDate).isValid()
                    ? dayjs(section.testDate).format("DD MMM YYYY")
                    : section.testDate}
                </Text>
                {section.testTime && (
                  <Tag style={{ marginInlineStart: 8 }}>{section.testTime}</Tag>
                )}
              </div>
            </div>

            <Button
              type="primary"
              loading={starting === section.reopenId}
              disabled={starting != null && starting !== section.reopenId}
              onClick={() => handleStart(section)}
              style={{ borderRadius: 999, minWidth: 110 }}
            >
              Start
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReopenedSections;
