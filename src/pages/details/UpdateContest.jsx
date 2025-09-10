import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import apiClient from "../../services/api";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Flex,
  List,
  Row,
  Select,
  Space,
  Tag,
  theme,
  Typography,
} from "antd";
import useApiRequest from "../../hooks/useApiRequest";
import { checkRole } from "../../utils/roleUtils";
import { Role } from "../../data/role";
import { useSelector } from "react-redux";

const { Option } = Select;
const { Text } = Typography;

const UpdateContest = () => {
  const { id, type } = useParams();
  const { token } = theme.useToken();
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [availableSpeakingSessions, setAvailableSpeakingSessions] = useState(
    []
  );
  const { user } = useSelector((state) => state.auth);
  const [selectedDate, setSelectedDate] = useState();
  const [selectedBranch, setSelectedBranch] = useState();
  const [speakingType, setSpeakingType] = useState("all");
  const [availableSessions, setAvailableSessions] = useState([]);
  const [selectedTime, setSelectedTime] = useState("all");
  const [selectSession, setSelectSession] = useState();
  const [sessionLoading, setSessionLoading] = useState();
  const [speakers, setSpeakers] = useState([]);
  const [speakersLoading, setSpeakersLoading] = useState(false);
  const [speakerId, setSpeakerId] = useState();
  const navigate = useNavigate();

  const fetchSpeakerSession = useCallback(
    async (branch) => {
      if (!branch) {
        branch = selectedBranch;
      }
      if (!branch) {
        toast.warn("Please select Branch");
        return;
      }
      setSpeakersLoading(true);
      try {
        const response = await apiClient.get(
          `api/v1/branch/speakers/${branch}`
        );
        if (response.code === 200) {
          setSpeakers(response.data);
          return;
        } else {
          toast.warn(
            "This branch has not Speaker. Please add speakers this branch"
          );
          setSpeakers([]);
        }
      } catch (err) {
        setSpeakers({});
      } finally {
        setSpeakersLoading(false);
      }
    },
    [selectedBranch]
  );

  useEffect(() => {
    if (user.branchId || selectedBranch) {
      fetchSpeakerSession(user.branchId || selectedBranch);
    }
  }, [user.branchId, selectedBranch]);

  const { data, loading, error } = useApiRequest(
    `api/v1/booking/session/${id}/${type}?update=true`,
    [id, type]
  );
  const branches = useApiRequest("api/v1/branch/all");

  const fetchSession = useCallback(
    async (branch) => {
      if (!branch) branch = selectedBranch;
      if (!branch) {
        toast.warn("Please select Branch");
        return;
      }
      setSessionsLoading(true);
      try {
        const response = await apiClient.get(
          `api/v1/test-session/available?date=${selectedDate}&time=${selectedTime}&branch=${branch}`
        );
        if (response.code != 200) {
          setAvailableSessions([]);
          toast.error(
            response.message || `Error data for this date ${selectedDate}`
          );
          return;
        }
        setAvailableSessions(response.data);
      } catch (e) {
        setAvailableSessions([]);
        toast.error(
          e.response.data.message || `Error data for this date ${selectedDate}`
        );
      } finally {
        setSessionsLoading(false);
      }
    },
    [selectedBranch, selectedDate, selectedTime]
  );

  const fetchSpekingSession = useCallback(
    async (branch) => {
      if (!branch) branch = selectedBranch;
      if (!branch) {
        toast.warn("Please select Branch");
        return;
      }
      setSessionsLoading(true);
      try {
        const response = await apiClient.get(
          `api/v1/test-session/speaking/available?date=${selectedDate}&branch=${branch}&type=${speakingType}&speakerId=${speakerId}`
        );
        if (response.code != 200) {
          setAvailableSpeakingSessions([]);
          toast.error(
            response.message || `Error data for this date ${selectedDate}`
          );
          return;
        }
        setAvailableSpeakingSessions(response.data);
      } catch (e) {
        setAvailableSpeakingSessions([]);
        toast.error(
          e.response.data.message || `Error data for this date ${selectedDate}`
        );
      } finally {
        setSessionsLoading(false);
      }
    },
    [selectedBranch, selectedDate, speakingType, speakerId]
  );

  const disablePastDates = (current) => {
    return current && current < dayjs().startOf("day");
  };

  const getColor = (status) => {
    switch (status) {
      case "PROCESS":
        return "orange";
      case "COMPLETED":
        return "green";
      case "IN_COMPLETED":
        return "gray";
      case "FAILED":
        return "red";
      default:
        return "blue";
    }
  };

  const updateBooking = async () => {
    const request = {
      sessionId: selectSession.id,
    };

    setSessionLoading(true);
    try {
      const response = await apiClient.put(
        `api/v1/booking/update/${id}/${type}`,
        request
      );
      if (response.code != 200) {
        toast.error(response.message || "Not changed");
        return;
      }
      toast.success("Successfull changed!");
      navigate(`/dashboard/${type === "TEST" ? "contest" : "speaking"}`);
    } catch (err) {
      toast.error("Not updated");
    } finally {
      setSessionLoading(false);
    }
  };

  return (
    <div>
      <>
        <Row gutter={24}>
          <Col xs={24} md={12}>
            {type === "TEST" ? (
              <Card title="Current Booking Details" variant={"borderless"}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Flex gap={10} align="center">
                    <Text strong>Student Name:</Text>
                    <Text>{data?.data.booking?.studentName || "N/A"}</Text>
                  </Flex>
                  <Flex gap={10} align="center">
                    <Text strong>Status:</Text>
                    <Tag color={getColor(data?.data.booking?.status)}>
                      {data?.data.booking?.status || "N/A"}
                    </Tag>
                  </Flex>
                  <Flex gap={10} align="center">
                    <Text strong>Branch:</Text>
                    <Text>{data?.data.booking?.branch || "N/A"}</Text>
                  </Flex>
                  <Flex gap={10} align="center">
                    <Text strong>Test Date:</Text>
                    <Tag color="red">
                      {data?.data.booking?.testDate || "N/A"}
                    </Tag>
                  </Flex>
                  <Flex gap={10} align="center">
                    <Text strong>Test Time:</Text>
                    <Tag color="green">{data?.data.booking?.time || "N/A"}</Tag>
                  </Flex>
                </Space>
              </Card>
            ) : (
              <Card title={"Current Speaking session"} variant="borderless">
                <Space
                  direction="horizontal"
                  size="middle"
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Flex gap={10} align="center">
                      <Text strong>Branch:</Text>
                      <Text>{data?.data.speaking?.branchName || "N/A"}</Text>
                    </Flex>
                    <Flex gap={10} align="center">
                      <Text strong>Speaker Name:</Text>
                      <Text>{data?.data.speaking?.speakerName || "N/A"}</Text>
                    </Flex>
                    <Flex gap={10} align="center">
                      <Text strong>Date:</Text>
                      <Tag color="blue">
                        {data?.data.speaking?.date || "N/A"}
                      </Tag>
                    </Flex>
                    <Flex gap={10} align="center">
                      <Text strong>Time:</Text>
                      <Tag color="green">
                        {data?.data.speaking?.time || "N/A"}
                      </Tag>
                    </Flex>
                    <Text>
                      <Text strong>Type:</Text>{" "}
                      <Tag color="green">{data?.data.speaking?.type}</Tag>
                    </Text>
                  </Space>
                </Space>
              </Card>
            )}
          </Col>
          {selectSession && (
            <Col xs={24} md={12}>
              {type === "TEST" ? (
                <Card
                  title={
                    type === "TEST"
                      ? "Change this session"
                      : "Change this speaking session"
                  }
                  variant={"borderless"}
                >
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Flex gap={10}>
                      <Text strong>Branch name:</Text>
                      <Text>{selectSession.branchName}</Text>
                    </Flex>
                    <Flex gap={10}>
                      <Text strong>Test Date:</Text>
                      <Tag color="blue">{selectSession.date}</Tag>
                    </Flex>
                    <Text>
                      <Text strong>Test Time:</Text>{" "}
                      <Tag color="green-inverse">{selectSession.time}</Tag>
                    </Text>
                  </Space>
                </Card>
              ) : (
                <Card title="Change this session" variant={"borderless"}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Flex gap={10}>
                      <Text strong>Branch name:</Text>
                      <Text>{selectSession.branchName}</Text>
                    </Flex>
                    <Flex gap={10} align="center">
                      <Text strong>Speaker Name:</Text>
                      <Text>{selectSession.speakerName || "N/A"}</Text>
                    </Flex>
                    <Flex gap={10}>
                      <Text strong>Test Date:</Text>
                      <Tag color="blue">{selectSession.date}</Tag>
                    </Flex>
                    <Text>
                      <Text strong>🕒 Speaking Time:</Text>{" "}
                      <Tag color="green-inverse">{selectSession.time}</Tag>
                    </Text>
                    <Text>
                      <Text strong>Type:</Text>{" "}
                      <Tag color="green">{selectSession.type}</Tag>
                    </Text>
                  </Space>
                </Card>
              )}
              <Flex justify="end" style={{ marginTop: "10px" }}>
                <Button
                  type="primary"
                  onClick={updateBooking}
                  loading={sessionLoading}
                >
                  Update booking
                </Button>
              </Flex>
            </Col>
          )}
        </Row>
        {!branches.loading && branches.data && (
          <>
            {type === "TEST" ? (
              <div
                style={{
                  marginTop: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                }}
              >
                {checkRole(user.roles, Role.ROLE_ADMIN) && (
                  <Select
                    placeholder="Select branch"
                    style={{ width: 300 }}
                    onChange={(value) => setSelectedBranch(value)}
                  >
                    {branches.data?.data?.branches?.map((branch) => (
                      <Option key={branch.id} value={branch.id}>
                        {branch.name}
                      </Option>
                    ))}
                  </Select>
                )}
                <DatePicker
                  disabledDate={disablePastDates}
                  style={{ width: "300px" }}
                  onChange={(date) =>
                    setSelectedDate(dayjs(date).format("YYYY-MM-DD"))
                  }
                />
                <Select
                  placeholder={"Select which time"}
                  style={{ width: 300 }}
                  onChange={(value) => setSelectedTime(value)}
                >
                  <Option key={"all"}>All</Option>
                  {branches.data.data.testTimes.map((time) => (
                    <Option key={time}>
                      {time.charAt(0).toUpperCase() + time.slice(1)}
                    </Option>
                  ))}
                </Select>
                <Button
                  type="primary"
                  onClick={() => {
                    if (!selectedDate) {
                      toast.warning("Please select branch, date");
                      return;
                    }
                    fetchSession(user.branchId);
                  }}
                >
                  Show test session
                </Button>
              </div>
            ) : (
              <div
                style={{
                  marginTop: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                }}
              >
                {checkRole(user.roles, Role.ROLE_ADMIN) && (
                  <Select
                    placeholder="Select branch"
                    style={{ width: 300 }}
                    onChange={(value) => setSelectedBranch(value)}
                  >
                    {branches.data?.data?.branches?.map((branch) => (
                      <Option key={branch.id} value={branch.id}>
                        {branch.name}
                      </Option>
                    ))}
                  </Select>
                )}
                <DatePicker
                  disabledDate={disablePastDates}
                  style={{ width: "300px" }}
                  onChange={(date) =>
                    setSelectedDate(dayjs(date).format("YYYY-MM-DD"))
                  }
                />
                <Select
                  value={speakingType}
                  placeholder="Select Speaking type"
                  style={{ width: 300 }}
                  onChange={(value) => setSpeakingType(value)}
                >
                  <Option key={"all"}>All</Option>
                  <Option key={"FACE_TO_FACE"}>Face to Face</Option>
                  <Option key={"ONLINE"}>Online</Option>
                </Select>
                <Select
                  placeholder="Please select speaker"
                  style={{ width: 300 }}
                  onChange={(value) => setSpeakerId(value)}
                  disabled={speakersLoading || !speakers.length}
                >
                  {speakers.map((speaker) => (
                    <Option key={speaker.id} value={speaker.id}>
                      {speaker.firstname} {speaker.lastname}
                    </Option>
                  ))}
                </Select>
                <Button
                  type="primary"
                  onClick={() => {
                    if (!selectedDate) {
                      toast.warning("Please select branch, date");
                      return;
                    }
                    if (!speakerId) {
                      toast.warning("Please select or add Speaker");
                      return;
                    }
                    fetchSpekingSession(user.branchId);
                  }}
                >
                  Show speaking session
                </Button>
              </div>
            )}
          </>
        )}
        {type === "TEST" ? (
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, xl: 4 }}
            loading={sessionsLoading}
            dataSource={availableSessions}
            renderItem={(session) => {
              const isSelectable = session.existedSpace || false; // isExistSelectedSession(session);
              return (
                <List.Item onClick={() => setSelectSession(session)}>
                  <Card
                    hoverable={isSelectable}
                    style={{
                      borderRadius: 12,
                      borderColor: false //isExistSelectedSession(session)
                        ? token.colorPrimary
                        : "#f0f0f0", // default kulrang
                      cursor: isSelectable ? "pointer" : "not-allowed",
                      boxShadow: false //isExistSelectedSession(session)
                        ? "0 0 0 2px #1890ff33"
                        : undefined,
                    }}
                    title={
                      <Flex justify="space-between" align="center">
                        <Text
                          strong
                          style={{
                            fontSize: 16,
                            width: "60%",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {session.branchName}
                        </Text>
                        <Tag color="blue">{session.date}</Tag>
                      </Flex>
                    }
                  >
                    <Space direction="vertical" size="small">
                      <Text>
                        <Text strong>Day of Week:</Text> {session.dayOfWeek}
                      </Text>
                      <Text>
                        <Text strong>Test Time:</Text> {session.time}
                      </Text>
                      <Text>
                        <Text strong>Status:</Text>{" "}
                        <Tag color={session.existedSpace ? "success" : "error"}>
                          {session.existedSpace
                            ? `${session.existedSpace} Available`
                            : "Fully Booked"}
                        </Tag>
                      </Text>
                    </Space>
                  </Card>
                </List.Item>
              );
            }}
            style={{ marginTop: 20 }}
          />
        ) : (
          <>
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3, xl: 4 }}
              loading={sessionsLoading}
              dataSource={availableSpeakingSessions}
              renderItem={(session) => {
                // const isSelectable = isExistSelectedSpeakingSession(session);

                return (
                  <List.Item onClick={() => setSelectSession(session)}>
                    <Card
                      hoverable={true}
                      style={{
                        borderRadius: 12,
                        borderColor: false ? token.colorPrimary : "#f0f0f0",
                        boxShadow: false ? "0 0 0 2px #1890ff33" : undefined,
                      }}
                      title={
                        <Flex justify="space-between" align="center">
                          <Text
                            strong
                            style={{
                              fontSize: 16,
                              width: "60%",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {session.branchName}
                          </Text>
                          <Tag color="blue">{session.date}</Tag>
                        </Flex>
                      }
                    >
                      <Space direction="vertical" size="small">
                        <Text>
                          <Text strong>🕒 Speaking Time:</Text> {session.time}
                        </Text>
                        <Text>
                          <Text strong>🧑‍🏫 Speaker:</Text> {session.speakerName}
                        </Text>
                        <Text>
                          <Text strong>Type:</Text>{" "}
                          <Tag color="green">{session.type}</Tag>
                        </Text>
                      </Space>
                    </Card>
                  </List.Item>
                );
              }}
              style={{ marginTop: 20 }}
            />
          </>
        )}
      </>
    </div>
  );
};

export default UpdateContest;
