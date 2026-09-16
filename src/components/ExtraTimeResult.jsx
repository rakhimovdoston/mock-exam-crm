import React, { useState } from "react";
import { Alert, Button, Space, Table, Tag, Typography } from "antd";
import { TIME_TYPE, useShiftLabel, useTimeTypeLabel } from "../utils/extraTime";
import { useT } from "../i18n/useT";

const { Text } = Typography;

/** t() has no interpolation, so counts are filled in at the call site. */
const fill = (text, count) => String(text).replace("{n}", count);

/**
 * The outcome of a grant, in the one shape all three paths answer with —
 * whole session, one student, or one exam id. Written once so the three never
 * drift apart in what they show.
 *
 * The counts are always both on screen, including a zero skipped count: a 200
 * does not mean everyone got the time, so the number has to be read rather than
 * inferred from the absence of a warning.
 */
const ExtraTimeResult = ({ result }) => {
  const t = useT();
  const shiftLabel = useShiftLabel();
  const timeTypeLabel = useTimeTypeLabel();

  const [showGranted, setShowGranted] = useState(false);
  const [showSkipped, setShowSkipped] = useState(true);

  if (!result) return null;

  const grantedCount = result.granted_count ?? 0;
  const skippedCount = result.skipped_count ?? 0;

  // Module grants predate the field, so anything unlabelled is a module grant.
  const timeType = result.type === TIME_TYPE.OVERALL ? TIME_TYPE.OVERALL : TIME_TYPE.MODULE;

  const grantedColumns = [
    { title: t("extraTime.student"), dataIndex: "student_name", key: "name" },
    {
      title: t("common.time"),
      dataIndex: "test_time",
      key: "test_time",
      width: 130,
      render: (value) => <Tag color="blue">{shiftLabel(value)}</Tag>,
    },
    {
      // Cumulative, not what was just added — and cumulative for this level
      // only: module minutes and overall minutes never add up together.
      title: t("extraTime.totalExtra"),
      dataIndex: "total_extra_minutes",
      key: "total",
      width: 140,
      render: (value) => <Tag color="green">{value}</Tag>,
    },
  ];

  const skippedColumns = [
    { title: t("extraTime.student"), dataIndex: "student_name", key: "name" },
    { title: t("extraTime.reasonCol"), dataIndex: "reason", key: "reason" },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Space size={8}>
        <Tag color={timeType === TIME_TYPE.OVERALL ? "purple" : "blue"}>
          {timeTypeLabel(timeType)}
        </Tag>
        {result.module && <Tag>{result.module}</Tag>}
      </Space>

      <Alert
        type={grantedCount > 0 ? "success" : "warning"}
        showIcon
        message={
          grantedCount > 0
            ? fill(t("extraTime.grantedCount"), grantedCount)
            : t("extraTime.noneGranted")
        }
        description={result.message}
        action={
          grantedCount > 0 ? (
            <Button
              size="small"
              type="text"
              onClick={() => setShowGranted((open) => !open)}
            >
              {showGranted ? t("extraTime.hideList") : t("extraTime.showList")}
            </Button>
          ) : null
        }
      />

      {showGranted && grantedCount > 0 && (
        <Table
          size="small"
          rowKey={(row) => row.exam_id ?? row.user_id}
          columns={grantedColumns}
          dataSource={result.granted || []}
          pagination={false}
          scroll={{ y: 220 }}
        />
      )}

      {skippedCount > 0 ? (
        <>
          <Alert
            type="warning"
            showIcon
            message={fill(t("extraTime.skippedCount"), skippedCount)}
            action={
              <Button
                size="small"
                type="text"
                onClick={() => setShowSkipped((open) => !open)}
              >
                {showSkipped ? t("extraTime.hideList") : t("extraTime.showList")}
              </Button>
            }
          />

          {showSkipped && (
            <Table
              size="small"
              rowKey={(row) => row.exam_id ?? row.user_id}
              columns={skippedColumns}
              dataSource={result.skipped || []}
              pagination={false}
              scroll={{ y: 220 }}
            />
          )}
        </>
      ) : (
        <Text type="secondary">{fill(t("extraTime.skippedCount"), 0)}</Text>
      )}
    </Space>
  );
};

export default ExtraTimeResult;
