import { Card, Typography, Space } from "antd";
const { Title, Text } = Typography;

export default function BookingPlanCard({ plan, onSelect, select, disable }) {
  const selected = select && select.id == plan.id;
  return (
    <Card
      title={<Title level={4}>{plan.name}</Title>}
      hoverable={!selected && disable}
      style={{
        height: "100%",
        borderColor: selected ? "#1890ff" : undefined,
        borderWidth: selected ? 2 : 1,
        borderStyle: "solid",
      }}
      onClick={() => {
        if (!disable) onSelect(plan);
      }}
    >
      <Space direction="vertical" size="small">
        <Text>
          📆 Total sessions: <b>{plan.totalSessions}</b>
        </Text>
        <Text>
          🗣 Speaking included: <b>{plan.speakingSessions}</b> time(s)
        </Text>
        <Text>
          ⏱ Duration: <b>{plan.durationWeeks}</b> week(s)
        </Text>
      </Space>
    </Card>
  );
}
