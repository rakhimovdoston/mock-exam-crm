import React, { useCallback, useEffect, useState } from "react";
import useApiRequest from "../../hooks/useApiRequest";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Card,
  Col,
  Collapse,
  DatePicker,
  Flex,
  List,
  Row,
  Select,
  Skeleton,
  Space,
  Spin,
  Tag,
  theme,
  Typography,
} from "antd";
import dayjs from "dayjs";
import BookingPlanCard from "./BookingPlanCard";
import { toast } from "react-toastify";
import apiClient from "../../services/api";
import { useSelector } from "react-redux";
import { checkRole } from "../../utils/roleUtils";
import { Role } from "../../data/role";

const { Title, Text } = Typography;
const { Option } = Select;

const UserBookingPage = () => {
  const { id } = useParams();
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const [planSelected, setPlanSelected] = useState();
  const [selectedBranch, setSelectedBranch] = useState();
  const [speakingType, setSpeakingType] = useState("all");
  const [selectedDate, setSelectedDate] = useState();
  const [selectedTime, setSelectedTime] = useState("all");
  const [availableSessions, setAvailableSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [selectSessions, setSelectSessions] = useState([]);
  const [selectedSpeaking, setSelectedSpeaking] = useState([]);

  const [activeSpeaking, setActiveSpeaking] = useState(false);
  const [availableSpeakingSessions, setAvailableSpeakingSessions] = useState(
    []
  );
  const [bookingLoading, setBookingLoading] = useState(false);
  const [speakers, setSpeakers] = useState([]);
  const [speakersLoading, setSpeakersLoading] = useState(false);
  const [speakerId, setSpeakerId] = useState();
  const { user } = useSelector((state) => state.auth);

  const { data, loading } = useApiRequest(`api/v1/admin/user/by/${id}`, [id]);
  const branches = useApiRequest("api/v1/branch/all");

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
        setSpeakers([]);
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

  const fetchSession = useCallback(
    async (branch) => {
      if (!branch) branch = selectedBranch;
      if (!branch) {
        toast.warn("Please select branch");
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
        toast.warn("Please select branch");
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

  if (loading)
    return (
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

  const disablePastDates = (current) => {
    return current && current < dayjs().startOf("day");
  };

  const isExistSelectedSession = (session) => {
    return selectSessions.some((item) => item.id === session.id);
  };

  const handleSessionCheck = (session) => {
    if (!session.existedSpace) return;

    setSelectSessions((prev) => {
      const exists = prev.some((item) => item.id === session.id);
      if (exists) {
        return prev.filter((item) => item.id !== session.id);
      } else {
        if (prev.length >= planSelected.totalSessions) {
          toast.warn(
            `You can select only ${planSelected.totalSessions} test sessions`
          );
          return prev;
        }

        return [...prev, session];
      }
    });
  };

  const isExistSelectedSpeakingSession = (session) => {
    return selectedSpeaking.some((item) => item.id === session.id);
  };

  const handleSpeakingSession = (session) => {
    setSelectedSpeaking((prev) => {
      const exists = prev.some((item) => item.id === session.id);
      if (exists) {
        return prev.filter((item) => item.id !== session.id);
      } else {
        if (prev.length >= planSelected.speakingSessions) {
          toast.warn(
            `You can select only ${planSelected.speakingSessions} speaking sessions`
          );
          return prev;
        }

        return [...prev, session];
      }
    });
  };

  const bookingMethod = async () => {
    if (
      selectSessions.length === 0 ||
      selectSessions.length < planSelected.totalSessions
    ) {
      toast.warn(
        `Please select ${
          planSelected.totalSessions - selectSessions.length
        } test sessions date:`
      );
      return;
    }
    if (!activeSpeaking) {
      setActiveSpeaking(true);
      return;
    }

    if (
      selectedSpeaking.length === 0 ||
      selectedSpeaking.length < planSelected.speakingSessions
    ) {
      toast.warn(
        `Please select ${
          planSelected.speakingSessions - selectedSpeaking.length
        } speaking sessions date:`
      );
      return;
    }
    const requestBody = {
      packageId: planSelected.id,
      userId: id,
      branch: selectedBranch,
      sessionIds: selectSessions.map((session) => session.id),
      speakingSessionIds: selectedSpeaking.map((session) => session.id),
    };

    setBookingLoading(true);
    try {
      const response = await apiClient.post("api/v1/booking/set", requestBody);
      if (response.code != 200) {
        toast.error(response.message || "");
        return;
      }
      navigate("/dashboard/contest");
    } catch (e) {
      toast.error(e?.response?.data.message || "Failed Booking service");
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div>
      <Card>
        <Title level={3} style={{ margin: "10px 0" }}>
          Booking{" "}
          <b style={{ color: token.colorPrimary }}>
            {data?.data?.firstname} {data?.data?.lastname}
          </b>
        </Title>
      </Card>

      <div style={{ width: "100%", marginTop: "10px" }}>
        {branches.loading && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 15,
            }}
          >
            <Skeleton active style={{ width: "100%" }} />
            <Skeleton active style={{ width: "100%" }} />
            <Skeleton active style={{ width: "100%" }} />
          </div>
        )}
        {!branches.loading && !branches.data && <div></div>}
        <Row gutter={[16, 16]}>
          {branches.data &&
            branches.data?.data?.packages.map((plan) => (
              <Col span={6} key={plan.id}>
                <BookingPlanCard
                  disable={activeSpeaking}
                  plan={plan}
                  select={planSelected}
                  onSelect={setPlanSelected}
                />
              </Col>
            ))}
        </Row>
        {planSelected && (
          <Collapse
            bordered={false}
            expandIcon={() => {}}
            style={{ marginBottom: "10px" }}
          >
            <Collapse.Panel
              header={
                <Title level={3} style={{ margin: "" }}>
                  Selected Test session date
                </Title>
              }
            >
              {selectSessions.length > 0 && (
                <List
                  grid={{ gutter: 16, xs: 1, sm: 2, md: 3, xl: 4 }}
                  loading={sessionsLoading}
                  dataSource={selectSessions}
                  renderItem={(session) => {
                    return (
                      <List.Item>
                        <Card
                          hoverable={false}
                          style={{
                            borderRadius: 12,
                            borderColor: "#f0f0f0", // default kulrang
                            cursor: "pointer",
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
                              <Text strong>Day of Week:</Text>{" "}
                              {session.dayOfWeek}
                            </Text>
                            <Text>
                              <Text strong>Test Time:</Text> {session.time}
                            </Text>
                            <Text>
                              <Text strong>Status:</Text>{" "}
                              <Tag
                                color={
                                  session.existedSpace ? "success" : "error"
                                }
                              >
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
              )}
            </Collapse.Panel>
          </Collapse>
        )}
        {!activeSpeaking ? (
          <>
            {planSelected && !branches.loading && branches.data && (
              <>
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
                      // branch
                      fetchSession(user.branchId);
                    }}
                  >
                    Show test session
                  </Button>
                </div>
              </>
            )}

            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3, xl: 4 }}
              loading={sessionsLoading}
              dataSource={availableSessions}
              renderItem={(session) => {
                const isSelectable =
                  session.existedSpace || isExistSelectedSession(session);

                return (
                  <List.Item onClick={() => handleSessionCheck(session)}>
                    <Card
                      hoverable={isSelectable}
                      style={{
                        borderRadius: 12,
                        borderColor: isExistSelectedSession(session)
                          ? token.colorPrimary
                          : "#f0f0f0", // default kulrang
                        cursor: isSelectable ? "pointer" : "not-allowed",
                        boxShadow: isExistSelectedSession(session)
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
                          <Tag
                            color={session.existedSpace ? "success" : "error"}
                          >
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
          </>
        ) : (
          <>
            {planSelected && (
              <Collapse bordered={false} expandIcon={() => {}}>
                <Collapse.Panel
                  header={
                    <Title level={3} style={{ margin: "" }}>
                      Selected speaking session date
                    </Title>
                  }
                >
                  {selectedSpeaking.length > 0 && (
                    <List
                      grid={{ gutter: 16, xs: 1, sm: 2, md: 3, xl: 4 }}
                      loading={sessionsLoading}
                      dataSource={selectedSpeaking}
                      renderItem={(session) => {
                        return (
                          <List.Item>
                            <Card
                              hoverable={false}
                              style={{
                                borderRadius: 12,
                                borderColor: "#f0f0f0",
                                cursor: "pointer",
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
                                  <Text strong>🕒 Speaking Time:</Text>{" "}
                                  {session.time}
                                </Text>
                                <Text>
                                  <Text strong>🧑‍🏫 Speaker:</Text>{" "}
                                  {session.speakerName}
                                </Text>
                              </Space>
                            </Card>
                          </List.Item>
                        );
                      }}
                      style={{ marginTop: 20 }}
                    />
                  )}
                </Collapse.Panel>
              </Collapse>
            )}
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

                  fetchSpekingSession(user.branchId);
                }}
              >
                Show speaking session
              </Button>
            </div>
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3, xl: 4 }}
              loading={sessionsLoading}
              dataSource={availableSpeakingSessions}
              renderItem={(session) => {
                const isSelectable = isExistSelectedSpeakingSession(session);

                return (
                  <List.Item onClick={() => handleSpeakingSession(session)}>
                    <Card
                      hoverable={!isSelectable}
                      style={{
                        borderRadius: 12,
                        borderColor: isSelectable
                          ? token.colorPrimary
                          : "#f0f0f0",
                        boxShadow: isSelectable
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

        {((!activeSpeaking && planSelected && availableSessions.length > 0) ||
          activeSpeaking) && (
          <Flex justify="flex-end">
            <Button
              type="primary"
              onClick={bookingMethod}
              loading={bookingLoading}
            >
              {activeSpeaking ? "Booking" : "Next"}
            </Button>
          </Flex>
        )}
      </div>
    </div>
  );
};

export default UserBookingPage;
