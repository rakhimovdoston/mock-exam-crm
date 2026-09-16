import React from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  List,
  Row,
  Skeleton,
  Space,
  Tag,
  Typography,
  theme,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import {
  CreditCardOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  HourglassOutlined,
  SoundOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { PanelError } from "../components/PanelState";
import { ATTENTION_BLOCKS, severityColor } from "../attentionBlocks";
import { useT } from "../../../i18n/useT";

/** t() has no interpolation; counts are filled in at the call site. */
const fill = (text, count) => String(text).replace("{n}", count);

const { Text } = Typography;

/** One line per item — the fields differ per block, so only what came is shown. */
const ItemLine = ({ item }) => {
  const parts = [item.testDate, item.testTime, item.module].filter(Boolean);

  return (
    <List.Item style={{ padding: "6px 0", border: 0 }}>
      <Text style={{ fontSize: 13 }}>{item.studentName || `#${item.examId}`}</Text>
      {parts.length > 0 && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {parts.join(" · ")}
        </Text>
      )}
    </List.Item>
  );
};

const AttentionPanel = ({ data, loading, error, onRetry, visibleKeys, example }) => {
  const t = useT();
  const { token } = theme.useToken();

  // Nothing came back at all — a failed request, or no payload. Standing in
  // example blocks at least shows what this queue is for.
  //
  // A payload whose counts are all zero is NOT this case: that is a real "all
  // clear", and filling it with invented names would send someone chasing
  // students who do not exist.
  const usingExample = !loading && !data && Boolean(example);
  const source = data ?? (usingExample ? example : null);

  if (error && !usingExample) return <PanelError error={error} onRetry={onRetry} />;

  const colours = severityColor(token);

  const blocks = ATTENTION_BLOCKS.filter(
    (block) => !visibleKeys || visibleKeys.includes(block.key)
  );

  const total = blocks.reduce(
    (sum, block) => sum + (source?.[block.key]?.count ?? 0),
    0
  );

  if (!loading && total === 0) {
    return (
      <Card variant="outlined">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t("dashboard.nothingToAction")}
        />
      </Card>
    );
  }

  const grid = (
    <Row gutter={[16, 16]}>
      {blocks.map((block) => {
        const entry = source?.[block.key];
        const count = entry?.count ?? 0;
        // A block with nothing in it stays on screen but goes quiet, so the
        // page does not reshuffle as the day goes on.
        const isQuiet = !loading && count === 0;

        return (
          <Col xs={24} sm={12} xl={8} key={block.key}>
            <Card variant="outlined" style={{ height: "100%", opacity: isQuiet ? 0.55 : 1 }}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 2 }} title={{ width: "50%" }} />
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        color: isQuiet ? token.colorTextQuaternary : colours[block.severity],
                        fontSize: 16,
                      }}
                    >
                      {block.icon}
                    </span>
                    <Text strong style={{ fontSize: 13.5 }}>
                      {t(`dashboard.${block.key}`)}
                    </Text>
                    <Tag
                      style={{ marginInlineStart: "auto" }}
                      color={isQuiet ? undefined : block.severity === "critical" ? "red" : "orange"}
                    >
                      {count}
                    </Tag>
                  </div>

                  {entry?.items?.length > 0 && (
                    <List
                      size="small"
                      style={{ marginTop: 10 }}
                      dataSource={entry.items}
                      renderItem={(item) => (
                        <ItemLine item={item} key={item.examId ?? item.bookingId} />
                      )}
                    />
                  )}

                  {count > (entry?.items?.length ?? 0) && (
                    <Link to={block.to} style={{ fontSize: 12.5 }}>
                      {fill(
                        t("dashboard.andMore"),
                        count - (entry?.items?.length ?? 0)
                      )}{" "}
                      →
                    </Link>
                  )}
                </>
              )}
            </Card>
          </Col>
        );
      })}
    </Row>
  );

  if (!usingExample) return grid;

  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <Alert
        type="warning"
        showIcon
        message={t("dashboard.exampleFallback")}
        action={
          onRetry && (
            <Button size="small" icon={<ReloadOutlined />} onClick={onRetry}>
              {t("common.retry")}
            </Button>
          )
        }
      />
      {/* Dimmed as well as labelled, so the block never reads as live. */}
      <div style={{ opacity: 0.75 }}>{grid}</div>
    </Space>
  );
};

export default AttentionPanel;
