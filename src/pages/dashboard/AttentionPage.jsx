import React, { useMemo } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  theme,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { Link, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import dayjs from "dayjs";

import usePolledRequest from "../../hooks/usePolledRequest";
import StatTile from "./components/StatTile";
import { PanelError, StaleBadge } from "./components/PanelState";
import { ATTENTION_BLOCKS, severityColor } from "./attentionBlocks";
import { DEMO_ATTENTION } from "./demoData";
import { useShiftLabel } from "../../utils/extraTime";
import { Role } from "../../data/role";
import { checkRole } from "../../utils/roleUtils";
import { useT } from "../../i18n/useT";

const { Title, Text } = Typography;

const LIVE_REFRESH_MS = 60000;

/**
 * The problem desk.
 *
 * The dashboard block answers "is anything wrong"; this page is where the
 * answer gets worked through. A branch admin sees their own branch because the
 * backend narrows the response to it; an admin sees every branch and can pick
 * one.
 */
const AttentionPage = () => {
  const t = useT();
  const { token } = theme.useToken();
  const shiftLabel = useShiftLabel();
  const { user } = useSelector((state) => state.auth);

  const isAdmin = checkRole(user?.roles || [], Role.ROLE_ADMIN);

  const [params, setParams] = useSearchParams();
  const branchId = params.get("branch") || undefined;
  const demo = params.get("demo") === "1";
  const dateRaw = params.get("date");
  const parsed = dateRaw ? dayjs(dateRaw, "YYYY-MM-DD", true) : null;
  const date = parsed?.isValid() ? parsed : dayjs();

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") next.delete(key);
      else next.set(key, String(value));
    });
    setParams(next, { replace: true });
  };

  const branches = usePolledRequest(isAdmin ? "api/v1/branch/all" : null);
  const branchOptions = (branches.data?.data?.branches || []).map((branch) => ({
    value: branch.id,
    label: branch.name,
  }));

  const url = useMemo(() => {
    const query = new URLSearchParams({ date: date.format("YYYY-MM-DD") });
    if (branchId) query.set("branchId", branchId);
    return `api/v1/dashboard/attention?${query.toString()}`;
  }, [date, branchId]);

  const request = usePolledRequest(demo ? null : url, LIVE_REFRESH_MS);

  // Nothing came back at all — a failed request or no payload. The stand-in
  // shows what the desk is for. A payload whose counts are all zero is a real
  // "all clear" and is left alone.
  const usingExample = demo || (!request.loading && !request.data);
  const data = demo ? DEMO_ATTENTION : request.data?.data ?? (usingExample ? DEMO_ATTENTION : null);

  const countOf = (key) => data?.[key]?.count ?? 0;

  // Default to the first category that actually has something in it, so the
  // page opens on work rather than on an empty table.
  const requested = params.get("type");
  const selected =
    ATTENTION_BLOCKS.find((block) => block.key === requested)?.key ||
    ATTENTION_BLOCKS.find((block) => countOf(block.key) > 0)?.key ||
    ATTENTION_BLOCKS[0].key;

  const block = ATTENTION_BLOCKS.find((entry) => entry.key === selected);
  const entry = data?.[selected];
  const items = entry?.items || [];
  const hidden = (entry?.count ?? 0) - items.length;

  // Item fields differ per category, so a column only appears when the rows
  // that arrived actually carry it.
  const has = (field) => items.some((item) => item[field] != null);

  const columns = [
    {
      title: t("table.student"),
      key: "student",
      render: (_, item) =>
        item.userId ? (
          <Link to={`/dashboard/user/${item.userId}`}>
            {item.studentName || `#${item.examId ?? item.bookingId}`}
          </Link>
        ) : (
          item.studentName || `#${item.bookingId ?? item.examId}`
        ),
    },
    ...(has("testDate")
      ? [{ title: t("common.date"), dataIndex: "testDate", key: "testDate", width: 130 }]
      : []),
    ...(has("testTime")
      ? [
          {
            title: t("common.time"),
            dataIndex: "testTime",
            key: "testTime",
            width: 140,
            render: (value) => <Tag color="blue">{shiftLabel(value)}</Tag>,
          },
        ]
      : []),
    ...(has("module")
      ? [
          {
            title: t("dashboard.module"),
            dataIndex: "module",
            key: "module",
            width: 130,
            render: (value) => value.charAt(0).toUpperCase() + value.slice(1),
          },
        ]
      : []),
    ...(has("status")
      ? [{ title: t("common.status"), dataIndex: "status", key: "status", width: 140 }]
      : []),
  ];

  const filters = (
    <Space wrap>
      {isAdmin && (
        <Select
          allowClear
          style={{ minWidth: 200 }}
          placeholder={t("contest.selectBranch")}
          value={branchId ? Number(branchId) : undefined}
          loading={branches.loading}
          onChange={(value) => update({ branch: value })}
          options={branchOptions}
        />
      )}
      <DatePicker
        allowClear={false}
        value={date}
        onChange={(value) => value && update({ date: value.format("YYYY-MM-DD") })}
      />
      <Button icon={<ReloadOutlined />} onClick={request.refetch}>
        {t("common.retry")}
      </Button>
    </Space>
  );

  if (request.error && !usingExample) {
    return (
      <Space direction="vertical" size={20} style={{ width: "100%" }}>
        <Title level={3} style={{ margin: 0 }}>
          {t("dashboard.attention")}
        </Title>
        {filters}
        <PanelError error={request.error} onRetry={request.refetch} />
      </Space>
    );
  }

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <Row justify="space-between" align="bottom" gutter={[16, 16]}>
        <Col>
          <Space size={8} wrap>
            <Title level={3} style={{ margin: 0 }}>
              {t("dashboard.attention")}
            </Title>
            {request.stale && <StaleBadge />}
          </Space>
          <Text type="secondary">
            {isAdmin ? t("dashboard.attentionAllBranches") : t("dashboard.attentionOwnBranch")}
          </Text>
        </Col>
        <Col>{filters}</Col>
      </Row>

      {usingExample && (
        <Alert type="warning" showIcon message={t("dashboard.exampleFallback")} />
      )}

      <Row gutter={[16, 16]}>
        {ATTENTION_BLOCKS.map((item) => (
          <Col xs={12} sm={12} md={8} xl={4} key={item.key}>
            <StatTile
              label={t(`dashboard.${item.key}`)}
              value={countOf(item.key)}
              tone={
                countOf(item.key) === 0
                  ? "default"
                  : item.severity === "critical"
                  ? "danger"
                  : item.severity === "neutral"
                  ? "default"
                  : "warning"
              }
              active={item.key === selected}
              onClick={() => update({ type: item.key })}
              loading={request.loading && !usingExample}
            />
          </Col>
        ))}
      </Row>

      <Card
        variant="outlined"
        title={
          <Space size={10}>
            <span style={{ color: severityColor(token)[block.severity], fontSize: 16 }}>
              {block.icon}
            </span>
            <Text strong>{t(`dashboard.${block.key}`)}</Text>
            <Tag>{countOf(block.key)}</Tag>
          </Space>
        }
        extra={
          <Link to={block.to}>
            <Button type="link" size="small">
              {t("dashboard.openList")} →
            </Button>
          </Link>
        }
        styles={{ body: { padding: 0 } }}
      >
        <Table
          size="small"
          rowKey={(item) => item.examId ?? item.bookingId}
          loading={request.loading && !usingExample}
          columns={columns}
          dataSource={items}
          pagination={false}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t("dashboard.nothingInCategory")}
              />
            ),
          }}
        />

        {hidden > 0 && (
          // The endpoint returns only the first few rows per category; saying
          // how many are missing is the difference between "five" and "five of
          // nineteen".
          <div style={{ padding: "12px 16px", borderTop: `1px solid ${token.colorBorderSecondary}` }}>
            <Text type="secondary">
              {String(t("dashboard.andMore")).replace("{n}", hidden)}
            </Text>{" "}
            <Link to={block.to}>{t("dashboard.openList")} →</Link>
          </div>
        )}
      </Card>
    </Space>
  );
};

export default AttentionPage;
