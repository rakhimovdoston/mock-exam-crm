import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import useApiRequest from "../../hooks/useApiRequest";
import {
  Alert,
  Breadcrumb,
  Card,
  Col,
  Empty,
  Flex,
  List,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  Button,
} from "antd";
import apiClient from "../../services/api";
import { toast } from "react-toastify";

const { Title, Text } = Typography;

const BranchDetails = () => {
  const { id } = useParams();
  const [speakersLoading, setSpeakersLoading] = useState(false);
  const [speakers, setSpeakers] = useState([]);

  const { data, loading, error } = useApiRequest(
    `api/v1/branch/details/${id}`,
    []
  );

  const branch = useMemo(() => {
    if (!data?.data) return undefined;
    return data.data;
  }, [data]);

  const { packages, hasBranchSpecificPackages } = useMemo(() => {
    if (!data?.data?.packages || !branch) {
      return { packages: [], hasBranchSpecificPackages: false };
    }

    const filtered = data.data.packages.filter((pkg) => {
      if (pkg.branchId) {
        return String(pkg.branchId) === String(branch.id);
      }
      if (pkg.branch && pkg.branch.id) {
        return String(pkg.branch.id) === String(branch.id);
      }
      return false;
    });

    if (filtered.length) {
      return { packages: filtered, hasBranchSpecificPackages: true };
    }

    return { packages: data.data.packages, hasBranchSpecificPackages: false };
  }, [data, branch]);

  useEffect(() => {
    const fetchSpeakers = async () => {
      setSpeakersLoading(true);
      try {
        const response = await apiClient.get(`api/v1/branch/speakers/${id}`);
        if (response.code === 200) {
          setSpeakers(response.data || []);
        } else {
          setSpeakers([]);
        }
      } catch (err) {
        setSpeakers([]);
        if (err?.response?.data?.message) {
          toast.error(err.response.data.message);
        }
      } finally {
        setSpeakersLoading(false);
      }
    };

    if (id) {
      fetchSpeakers();
    }
  }, [id]);

  const packageColumns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Status",
      dataIndex: "active",
      key: "active",
      render: (active) => (
        <Tag color={active ? "green" : "red"}>
          {active ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price) => (
        <span>
          {price} <Text type="secondary">sum</Text>
        </span>
      ),
    },
    {
      title: "Total Sessions",
      dataIndex: "totalSessions",
      key: "totalSessions",
    },
    {
      title: "Speaking Sessions",
      dataIndex: "speakingSessions",
      key: "speakingSessions",
    },
  ];

  if (loading) {
    return (
      <Flex
        style={{ minHeight: "50vh" }}
        align="center"
        justify="center"
        vertical
      >
        <Spin size="large" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        message="Failed to load branch"
        description={error.message}
      />
    );
  }

  if (!branch) {
    return (
      <Card>
        <Empty description="Branch not found" />
        <Space style={{ marginTop: 16 }}>
          <Link to="/dashboard/venues">Back to venues</Link>
        </Space>
      </Card>
    );
  }

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={24}>
      <Flex justify="space-between" align="center">
        <Breadcrumb
          items={[
            { title: <Link to="/dashboard/venues">Venues</Link> },
            { title: branch.name },
          ]}
        />
        <Space>
          <Link to="/dashboard/venues">
            <Button>Back to venues</Button>
          </Link>
        </Space>
      </Flex>

      <Card
        title={
          <Space align="center">
            <Title level={4} style={{ margin: 0 }}>
              {branch.name}
            </Title>
            <Tag color={branch.active ? "blue" : "red"}>
              {branch.active ? "Active" : "Inactive"}
            </Tag>
          </Space>
        }
      >
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Statistic title="Maximum Capacity" value={branch.maxStudents || 0} />
          {branch.address && (
            <div>
              <Text type="secondary">Address</Text>
              <div>{branch.address}</div>
            </div>
          )}
          {branch.phone && (
            <div>
              <Text type="secondary">Contact</Text>
              <div>{branch.phone}</div>
            </div>
          )}
        </Space>
      </Card>

      <Card
        title={`Speakers (${speakers.length})`}
        extra={
          <Text type="secondary">
            {speakersLoading ? "Loading..." : "Assigned to this branch"}
          </Text>
        }
      >
        {speakersLoading ? (
          <Flex justify="center">
            <Spin />
          </Flex>
        ) : speakers.length ? (
          <List
            dataSource={speakers}
            renderItem={(speaker) => (
              <List.Item>
                <List.Item.Meta
                  title={`${speaker.firstname || ""} ${
                    speaker.lastname || ""
                  }`.trim()}
                  description={
                    <Space direction="vertical" size={0}>
                      {speaker.phone && (
                        <Text type="secondary">{speaker.phone}</Text>
                      )}
                      {speaker.username && (
                        <Text type="secondary">
                          Username: {speaker.username}
                        </Text>
                      )}
                    </Space>
                  }
                />
                {speaker.type && (
                  <Tag color="blue">{speaker.type.replace(/_/g, " ")}</Tag>
                )}
              </List.Item>
            )}
          />
        ) : (
          <Empty description="No speakers assigned yet" />
        )}
      </Card>
    </Space>
  );
};

export default BranchDetails;
