import React from "react";
import { useParams } from "react-router-dom";
import {
  Spin,
  Typography,
  Card,
  List,
  Row,
  Col,
  Divider,
  Avatar,
  Space,
} from "antd";
import {
  UserOutlined,
  ReadOutlined,
  SoundOutlined,
  EditOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

import useApiRequest from "../../hooks/useApiRequest";

const { Title, Text } = Typography;

const LoadingSpinner = () => (
  <div
    style={{
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <Spin size="large" />
  </div>
);

const ScoreBox = ({ icon, label, score }) => (
  <Card
    size="small"
    style={{
      minWidth: 120,
      textAlign: "center",
      backgroundColor: "#f0f5ff",
      border: "1px solid #1890ff",
      borderRadius: "8px",
    }}
  >
    <Space direction="vertical">
      {icon}
      <Text strong>{label}</Text>
      <Text>{score ?? "N/A"}</Text>
    </Space>
  </Card>
);

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
};

const calculateDuration = (start, end) => {
  if (!start || !end) return "N/A";
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate - startDate;

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  return `${hours}h ${minutes}m ${seconds}s`;
};

const UserDetails = () => {
  const { id } = useParams();

  const { data, loading } = useApiRequest(`api/v1/admin/user/by/${id}`);
  const { data: historyData, loading: historyLoading } = useApiRequest(
    `api/v1/history/all/${id}`
  );

  if (loading) return <LoadingSpinner />;

  const user = data?.data;
  const history = historyData?.data || [];

  return (
    <div style={{ padding: "40px" }}>
      <Card
        variant={"borderless"}
        style={{
          maxWidth: 600,
          borderRadius: "12px",
        }}
      >
        <Space direction="vertical" style={{ width: "100%" }} align="start">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Typography>Full name:</Typography>
            <Title level={3} style={{ margin: 0 }}>
              {user?.firstname} {user?.lastname}
            </Title>
          </div>
        </Space>
      </Card>

      <Divider>Test History</Divider>

      {historyLoading ? (
        <Spin />
      ) : (
        <List
          grid={{ gutter: 24, column: 1 }}
          dataSource={history}
          renderItem={(item) => (
            <List.Item>
              <Card
                title={
                  <Text>
                    <CalendarOutlined /> Test Date: {formatDate(item.startDate)}
                  </Text>
                }
                variant={"borderless"}
                style={{
                  borderRadius: "10px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <Row justify="space-between" align="top">
                  <Col>
                    <Space>
                      <Text>
                        <ClockCircleOutlined /> Duration:{" "}
                        {calculateDuration(item.startDate, item.endDate)}
                      </Text>
                    </Space>
                  </Col>
                  <Col>
                    <Space>
                      <ScoreBox
                        icon={<ReadOutlined />}
                        label="Reading"
                        score={item.reading}
                      />
                      <ScoreBox
                        icon={<SoundOutlined />}
                        label="Listening"
                        score={item.listening}
                      />
                      <ScoreBox
                        icon={<EditOutlined />}
                        label="Writing"
                        score={item.writing}
                      />
                    </Space>
                  </Col>
                </Row>
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default UserDetails;
