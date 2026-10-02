import React, { useState } from "react";
import { Alert, Button, Space, Table, Tag, Tooltip, Typography } from "antd";
import {
  groupByStudent,
  moduleLabel,
  sortModules,
  useShiftLabel,
} from "../utils/sectionReopen";
import { useT } from "../i18n/useT";

const { Text } = Typography;

/** t() has no interpolation, so counts are filled in at the call site. */
const fill = (text, count) => String(text).replace("{n}", count);

/**
 * What a reopen actually did, in the one shape all three paths answer with —
 * whole session, one student, or one exam id. Written once so the three never
 * drift apart in what they show.
 *
 * Both counts are always on screen, including a zero skipped count: a 200 does
 * not mean every student was reopened, so the number has to be read rather
 * than inferred from the absence of a warning. And `opened_count === 0` is not
 * a success even though the request succeeded, so it is not coloured as one.
 */
const SectionReopenResult = ({ result }) => {
  const t = useT();
  const shiftLabel = useShiftLabel();

  const [showOpened, setShowOpened] = useState(false);
  // The skipped list is the part an admin has to act on, so it starts open.
  const [showSkipped, setShowSkipped] = useState(true);

  if (!result) return null;

  const openedCount = result.opened_count ?? 0;
  const skippedCount = result.skipped_count ?? 0;

  const openedRows = groupByStudent(result.opened);
  const skippedRows = groupByStudent(result.skipped);

  /**
   * A module and the score it had before the answers were deleted, kept on one
   * line. Two parallel columns would let a student's modules and their scores
   * fall out of step as soon as either list was reordered.
   */
  const moduleLines = (entries, withScore) => (
    <Space direction="vertical" size={2}>
      {entries.map((entry, index) => (
        <Space key={`${entry.module}-${index}`} size={6}>
          <Tag style={{ marginInlineEnd: 0 }}>{moduleLabel(entry.module)}</Tag>
          {withScore &&
            (entry.previous_score != null && entry.previous_score !== "" ? (
              <Tooltip title={t("sectionReopen.previousScoreHint")}>
                <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                  {entry.previous_score}
                </Tag>
              </Tooltip>
            ) : (
              <Text type="secondary">{t("sectionReopen.noScore")}</Text>
            ))}
        </Space>
      ))}
    </Space>
  );

  const openedColumns = [
    {
      title: t("sectionReopen.student"),
      key: "name",
      render: (_, row) => row.name || "-",
    },
    {
      title: t("common.time"),
      key: "test_time",
      width: 120,
      render: (_, row) =>
        row.testTime ? <Tag color="blue">{shiftLabel(row.testTime)}</Tag> : "-",
    },
    {
      title: `${t("sectionReopen.module")} · ${t("sectionReopen.previousScore")}`,
      key: "modules",
      render: (_, row) => moduleLines(row.entries, true),
    },
  ];

  const skippedColumns = [
    {
      title: t("sectionReopen.student"),
      key: "name",
      render: (_, row) => row.name || "-",
    },
    {
      title: t("sectionReopen.module"),
      key: "modules",
      width: 140,
      render: (_, row) => moduleLines(row.entries, false),
    },
    {
      title: t("sectionReopen.reasonCol"),
      key: "reason",
      // One reason per module; identical text is not repeated.
      render: (_, row) => (
        <Space direction="vertical" size={2}>
          {Array.from(new Set(row.entries.map((entry) => entry.reason))).map(
            (reason) => (
              <Text key={reason}>{reason}</Text>
            )
          )}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      {result.modules?.length > 0 && (
        <Space size={8} wrap>
          {sortModules(result.modules).map((module) => (
            <Tag key={module} color="volcano">
              {moduleLabel(module)}
            </Tag>
          ))}
        </Space>
      )}

      <Alert
        type={openedCount > 0 ? "success" : "warning"}
        showIcon
        message={
          openedCount > 0
            ? fill(t("sectionReopen.openedCount"), openedCount)
            : t("sectionReopen.noneOpened")
        }
        description={result.message}
        action={
          openedCount > 0 ? (
            <Button
              size="small"
              type="text"
              onClick={() => setShowOpened((open) => !open)}
            >
              {showOpened
                ? t("sectionReopen.hideList")
                : t("sectionReopen.showList")}
            </Button>
          ) : null
        }
      />

      {showOpened && openedCount > 0 && (
        <Table
          size="small"
          rowKey="key"
          columns={openedColumns}
          dataSource={openedRows}
          pagination={false}
          scroll={{ y: 260 }}
        />
      )}

      {skippedCount > 0 ? (
        <>
          <Alert
            type="warning"
            showIcon
            message={fill(t("sectionReopen.skippedCount"), skippedCount)}
            description={t("sectionReopen.skippedHint")}
            action={
              <Button
                size="small"
                type="text"
                onClick={() => setShowSkipped((open) => !open)}
              >
                {showSkipped
                  ? t("sectionReopen.hideList")
                  : t("sectionReopen.showList")}
              </Button>
            }
          />

          {showSkipped && (
            <Table
              size="small"
              rowKey="key"
              columns={skippedColumns}
              dataSource={skippedRows}
              pagination={false}
              scroll={{ y: 260 }}
            />
          )}
        </>
      ) : (
        <Text type="secondary">{fill(t("sectionReopen.skippedCount"), 0)}</Text>
      )}
    </Space>
  );
};

export default SectionReopenResult;
