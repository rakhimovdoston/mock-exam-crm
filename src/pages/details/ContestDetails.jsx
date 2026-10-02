import React, { useState } from "react";
import useApiRequest from "../../hooks/useApiRequest";
import { Link, useParams } from "react-router-dom";
import {
  Card,
  Col,
  Layout,
  Row,
  Divider,
  Tabs,
  Image,
  Typography,
  Spin,
  Alert,
  Flex,
  Button,
  Space,
  Tag,
  Modal,
  Input,
  Descriptions,
} from "antd";
import {
  AudioOutlined,
  ReadOutlined,
  FileWordOutlined,
  CustomerServiceOutlined,
  FieldTimeOutlined,
  RedoOutlined,
} from "@ant-design/icons";
import {
  getQuestionNumbers,
  getQuestionNumbersForHeadins,
  getQuestionType,
  countListHeader,
} from "../../utils";
import RichTextViewer from "../../components/editor/RichTextViewer";
import { toast } from "react-toastify";
import apiClient from "../../services/api";
import { useSelector } from "react-redux";
import { Role } from "../../data/role";
import { checkRole } from "../../utils/roleUtils";
import dayjs from "dayjs";
import { formatDateTime } from "../../utils/dateUtils";
import ExtraTimeModal from "../../components/modal/ExtraTimeModal";
import SectionReopenModal from "../../components/modal/SectionReopenModal";
import AudioRetryModal from "../../components/modal/AudioRetryModal";
import { useT } from "../../i18n/useT";

const { Content } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const ContestDetails = () => {
  const { id, type } = useParams();
  const [refresh, setRefresh] = useState(0);
  const [resetLoading, setResetLoading] = useState(false);
  const [isSpeakingModalVisible, setIsSpeakingModalVisible] = useState(false);
  const [selectedSpeakingScore, setSelectedSpeakingScore] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [speakingLoading, setSpeakingLoading] = useState(false);
  const [extraTimeOpen, setExtraTimeOpen] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [audioRetryOpen, setAudioRetryOpen] = useState(false);
  const auth = useSelector((state) => state.auth);
  const t = useT();

  const { data, loading, error } = useApiRequest(
    `api/v1/booking/session/${id}/${type}`,
    [id, type, refresh]
  );

  if (loading || resetLoading) return <Spin size="large" />;
  if (error)
    return (
      <Alert
        message="Error"
        description={error.message}
        type="error"
        showIcon
      />
    );
  if (!data) return <Alert message="No data found" type="warning" showIcon />;

  // Extract data from response
  const {
    user = {},
    booking = {},
    readings = [],
    exam_id,
    status,
    listeningStatus,
    readingStatus,
    writingStatus,
    listeningTime,
    readingTime,
    writingTime,
    listening = [],
    writings = [],
    speaking = {},
  } = data.data;

  // A speaking-only session carries `booking: null`, and a destructuring
  // default only fills in for `undefined` — so this is read defensively rather
  // than trusted to be the `{}` above.
  const testDate = booking?.testDate;

  // How the extra-time, reopen and audio endpoints address this sitting.
  // Addressed by student where possible — the exam id path exists for the case
  // where this screen is all we have to go on.
  const examTarget = user?.id
    ? {
        userId: user.id,
        // Checked before it is parsed: `dayjs(undefined)` is the current
        // moment and reports itself valid, so parsing first would quietly send
        // today's date for a sitting that has none.
        date:
          testDate && dayjs(testDate).isValid()
            ? dayjs(testDate).format("YYYY-MM-DD")
            : undefined,
        testTime: booking?.time,
      }
    : { examId: exam_id ?? booking?.id };

  const studentName =
    booking?.studentName ||
    `${user?.firstname ?? ""} ${user?.lastname ?? ""}`.trim();

  // All three interventions carry the same permission: a branch admin may run
  // any of them for their own branch, and the backend refuses anyone else.
  const canManageExam =
    checkRole(auth.user.roles, Role.ROLE_ADMIN) ||
    checkRole(auth.user.roles, Role.ROLE_BRANCH_ADMIN);

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

  const retryListening = async (section) => {
    if (type !== "TEST") {
      toast.error("This action is only available for TEST type.");
      return;
    }
    setResetLoading(true);
    const request = {
      type: section,
      examId: exam_id ?? booking?.id,
      userId: user.id,
    };
    try {
      const response = await apiClient.post(
        `api/v1/history/retry-listening`,
        request
      );

      if (response.code !== 200) {
        toast.error(
          response.message || "Failed to reset section. Please try again."
        );
        return;
      }
      toast.success(`${section} is ready for a retry.`);
      setRefresh((prev) => prev + 1);
    } catch (error) {
      console.log("Error resetting section:", error);
      toast.error(error?.response?.data?.message || "Error resetting section");
    } finally {
      setResetLoading(false);
    }
  };

  const resetSection = async (section) => {
    if (type !== "TEST") {
      toast.error("This action is only available for TEST type.");
      return;
    }
    setResetLoading(true);
    const request = {
      section: section,
      examId: exam_id ?? booking?.id,
      type: exam_id ? "exam" : "booking",
      userId: user.id,
    };

    try {
      const response = await apiClient.post(
        `api/v1/history/reset-section`,
        request
      );

      if (response.code !== 200) {
        toast.error(
          response.message || "Failed to reset section. Please try again."
        );
        return;
      }
      toast.success("Section reset successfully!");
      setRefresh((prev) => prev + 1);
    } catch (error) {
      console.log("Error resetting section:", error);
      toast.error(error?.response?.data?.message || "Error resetting section");
    } finally {
      setResetLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = parseFloat(e.target.value);
    setSelectedSpeakingScore(e.target.value);
    if (value < 0 || value > 9) {
      setErrorMessage("Score must be between 0.0 and 9.0");
    } else {
      setErrorMessage("");
    }
  };

  const handleSpeakingModalOk = async () => {
    if (errorMessage) {
      toast.error("Score must be between 0.0 and 9.0");
      return;
    }
    setSpeakingLoading(true);
    try {
      const response = await apiClient.post(
        `api/v1/booking/speaking-score?id=${speaking?.id}&score=${selectedSpeakingScore}`
      );
      if (response.code !== 200) {
        toast.error(response.message || "Set Score some error");
        return;
      }
      setIsSpeakingModalVisible(false);
      setRefresh((prev) => prev + 1);
    } catch (err) {
    } finally {
      setSpeakingLoading(false);
    }
  };

  const handleSpeakingModalCancel = () => {
    setErrorMessage("");
    setSelectedSpeakingScore(null);
    setIsSpeakingModalVisible(false);
  };

  return (
    <Layout className="layout">
      <Content style={{ padding: "20px" }}>
        <Row gutter={24}>
          {/* Booking Details */}
          {data.data.type === "TEST" && (
            <Col xs={24} md={12}>
              <Card
                title="Booking Details"
                variant={"borderless"}
                // The one routine action lives in the header; the three below
                // are interventions, and mixing them into one stack made the
                // routine one look as consequential as deleting an answer.
                extra={
                  booking?.status != "COMPLETED" &&
                  booking?.status != "PROCESS" ? (
                    <Link to={`edit`}>
                      <Button type="primary">Edit booking</Button>
                    </Link>
                  ) : null
                }
              >
                <Descriptions
                  column={1}
                  size="small"
                  colon={false}
                  items={[
                    {
                      key: "student",
                      label: "Student",
                      children: booking?.studentName || "N/A",
                    },
                    {
                      key: "status",
                      label: "Status",
                      children: (
                        <Tag
                          color={getColor(booking?.status)}
                          style={{ marginInlineEnd: 0 }}
                        >
                          {booking?.status || "N/A"}
                        </Tag>
                      ),
                    },
                    {
                      key: "branch",
                      label: "Branch",
                      children: booking?.branch || "N/A",
                    },
                    {
                      // Date and shift name one sitting; they are read together.
                      key: "session",
                      label: "Session",
                      children: (
                        <Space size={6} wrap>
                          <Tag color="red" style={{ marginInlineEnd: 0 }}>
                            {booking?.testDate || "N/A"}
                          </Tag>
                          <Tag color="green" style={{ marginInlineEnd: 0 }}>
                            {booking?.time || "N/A"}
                          </Tag>
                        </Space>
                      ),
                    },
                  ]}
                />

                {canManageExam && (
                  <>
                    <Divider style={{ margin: "12px 0" }} />
                    <Text
                      type="secondary"
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: 0.4,
                        textTransform: "uppercase",
                      }}
                    >
                      {t("common.actions")}
                    </Text>
                    {/* Equal columns rather than a free-flowing row: three
                        ragged widths read as three unrelated things. Three
                        across only from `lg`, because the Uzbek labels run to
                        about twenty characters and a third of a half-width
                        card is not enough for that below it. */}
                    <Row gutter={[8, 8]} style={{ marginTop: 10 }}>
                      <Col xs={24} lg={8}>
                        <Button
                          block
                          icon={<FieldTimeOutlined />}
                          onClick={() => setExtraTimeOpen(true)}
                        >
                          {t("extraTime.singleAction")}
                        </Button>
                      </Col>
                      <Col xs={24} lg={8}>
                        <Button
                          block
                          icon={<CustomerServiceOutlined />}
                          onClick={() => setAudioRetryOpen(true)}
                        >
                          {t("audioRetry.singleAction")}
                        </Button>
                      </Col>
                      <Col xs={24} lg={8}>
                        {/* Last and red: it is the only one that deletes work. */}
                        <Button
                          block
                          danger
                          icon={<RedoOutlined />}
                          onClick={() => setReopenOpen(true)}
                        >
                          {t("sectionReopen.singleAction")}
                        </Button>
                      </Col>
                    </Row>
                  </>
                )}
              </Card>
            </Col>
          )}

          {/* User Info */}
          <Col xs={24} md={12}>
            <Card
              title="User Info"
              variant={"borderless"}
              extra={
                user?.id ? (
                  <Link to={`/dashboard/user/${user.id}`}>
                    <Button type="primary">View user details</Button>
                  </Link>
                ) : null
              }
            >
              <Descriptions
                column={1}
                size="small"
                colon={false}
                items={[
                  {
                    key: "name",
                    label: "Full name",
                    children:
                      `${user?.firstname ?? ""} ${user?.lastname ?? ""}`.trim() ||
                      "N/A",
                  },
                  {
                    key: "email",
                    label: "Email",
                    children: user?.email || "N/A",
                  },
                  {
                    key: "username",
                    label: "Username",
                    children: user?.username || "N/A",
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>
        <Divider />

        {/* Listening section */}
        {data.data.type === "SPEAKING" && (
          <Card
            title={
              <Flex justify="space-between" align="center" gap={20}>
                <Flex align="center" gap={10}>
                  <p>Speaking Details</p>
                  {(checkRole(auth.user.roles, Role.ROLE_ADMIN) ||
                    checkRole(auth.user.roles, Role.ROLE_BRANCH_ADMIN)) &&
                    speaking?.status !== "COMPLETED" && (
                      <Link to={"edit"}>
                        <Button type="primary">Edit</Button>
                      </Link>
                    )}
                </Flex>
                <p>Current Score: {speaking?.score || "0.0"}</p>
              </Flex>
            }
            variant="borderless"
          >
            <Space
              direction="horizontal"
              size="middle"
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <Space
                direction="horizontal"
                size="middle"
                style={{ width: "100%" }}
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Flex gap={10} align="center">
                    <Text strong>Date:</Text>
                    <Tag color="blue">{speaking?.date || "N/A"}</Tag>
                  </Flex>
                  <Flex gap={10} align="center">
                    <Text strong>Time:</Text>
                    <Tag color="blue">{speaking?.time || "N/A"}</Tag>
                  </Flex>
                </Space>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Flex gap={10} align="center">
                    <Text strong>Branch:</Text>
                    <Text>{speaking?.branchName || "N/A"}</Text>
                  </Flex>
                  <Flex gap={10} align="center">
                    <Text strong>Speaker Name:</Text>
                    <Text>{speaking?.speakerName || "N/A"}</Text>
                  </Flex>
                </Space>
              </Space>
              <Button
                type="primary"
                onClick={() => {
                  setIsSpeakingModalVisible(true);
                  setSelectedSpeakingScore(speaking?.score || null);
                }}
              >
                Set speaking score
              </Button>
              <Modal
                title="Speaking Assessment"
                open={isSpeakingModalVisible}
                loading={speakingLoading}
                onOk={handleSpeakingModalOk}
                okButtonProps={{
                  disabled: loading,
                  loading: loading,
                }}
                onCancel={handleSpeakingModalCancel}
              >
                <p>
                  Current Speaking Score: {selectedSpeakingScore ?? "0.0"} ball
                </p>
                <Input
                  min={0.0}
                  max={9.0}
                  value={selectedSpeakingScore}
                  placeholder="Enter new speaking score (5.5)"
                  type="number"
                  onChange={handleInputChange}
                />
                {errorMessage && (
                  <p style={{ color: "red", marginTop: "10px" }}>
                    {errorMessage}
                  </p>
                )}
              </Modal>
            </Space>
          </Card>
        )}

        {data.data.type === "TEST" && (
          <>
            <>
              <Card
                title={
                  <Flex justify="space-between" align="center" gap={20}>
                    <Title level={3}>Listening Section</Title>
                    <Flex align="center" gap={10}>
                      {listeningTime && <Tag>Time Taken: {listeningTime}</Tag>}
                      {status &&
                        (status === "LISTENING_PROCESS" ? (
                          <Tag color="orange">Listening processing</Tag>
                        ) : status !== "LISTENING_PROCESS" &&
                          listeningStatus === "completed" ? (
                          <Tag color="green">Listening Completed</Tag>
                        ) : (
                          <Tag>Waiting Listening</Tag>
                        ))}
                      {/* {exam_id && (
                        <Button
                          type="primary"
                          onClick={() => retryListening("listening")}
                        >
                          Retry Listening
                        </Button>
                      )} */}
                      {listening.length === 0 && (
                        <Button
                          htmlType="button"
                          onClick={() => resetSection("listening")}
                        >
                          Reset listening
                        </Button>
                      )}
                    </Flex>
                  </Flex>
                }
                variant={"borderless"}
              >
                {listening.length > 0 && (
                  <Tabs defaultActiveKey="0">
                    {listening.map((listening, index) => (
                      <TabPane
                        tab={
                          <span>
                            <AudioOutlined />
                            Part {index + 1}
                          </span>
                        }
                        key={index}
                      >
                        <div style={{ margin: "20px 0" }}>
                          <audio controls style={{ width: "100%" }}>
                            <source src={listening.audio} type="audio/mpeg" />
                          </audio>
                        </div>
                        <div
                          className="questions"
                          style={{ height: "600px", overflowY: "scroll" }}
                        >
                          {listening.questions?.map((question, qIdx) => (
                            <Card
                              key={qIdx}
                              title={
                                <p style={{ fontSize: "20px" }}>
                                  {" "}
                                  Questions {getQuestionNumbers(question)}
                                </p>
                              }
                              size="small"
                            >
                              <div key={question.id}>
                                <RichTextViewer
                                  content={question.content}
                                  type={question.type}
                                />
                              </div>
                            </Card>
                          ))}
                        </div>
                      </TabPane>
                    ))}
                  </Tabs>
                )}
              </Card>
              <Divider />
            </>

            {/* Reading section */}
            <>
              <Card
                title={
                  <Flex justify="space-between" align="center" gap={20}>
                    <Title level={3}>Reading Section</Title>
                    <Flex align="center" gap={10}>
                    {readingTime && <Tag>Time Taken: {readingTime}</Tag>}
                      {status &&
                        (status === "READING_PROCESS" ? (
                          <Tag color="orange">Reading processing</Tag>
                        ) : status !== "READING_PROCESS" &&
                          readingStatus === "completed" ? (
                          <Tag color="green">Reading Completed</Tag>
                        ) : (
                          <Tag> Waiting Reading</Tag>
                        ))}
                      {/* {exam_id && (
                        <Button
                          type="primary"
                          onClick={() => retryListening("reading")}
                        >
                          Retry Listening
                        </Button>
                      )} */}
                      {readings.length === 0 && (
                        <Button
                          htmlType="button"
                          onClick={() => resetSection("reading")}
                        >
                          Reset reading
                        </Button>
                      )}
                    </Flex>
                  </Flex>
                }
                variant={"borderless"}
              >
                {readings.length > 0 && (
                  <Tabs defaultActiveKey="0">
                    {readings.map((reading, index) => (
                      <TabPane
                        tab={
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                            }}
                          >
                            <ReadOutlined style={{ marginLeft: "5px" }} />
                            {getQuestionType(reading.type)}
                          </span>
                        }
                        key={index}
                      >
                        <div
                          key={reading.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                          }}
                        >
                          <div
                            style={{
                              flex: 1,
                              height: "600px",
                              overflowY: "scroll",
                            }}
                          >
                            <RichTextViewer
                              content={reading.content}
                              type={""}
                              is_passage={true}
                              difficultType={reading.type}
                            />
                          </div>
                          <div
                            style={{
                              flex: 1,
                              padding: "10px",
                              height: "600px",
                              overflowY: "scroll",
                            }}
                          >
                            {reading.questions.map((question) => (
                              <div key={question.id}>
                                <p
                                  style={{
                                    fontWeight: "bold",
                                    color: "#1677ff",
                                  }}
                                >
                                  Questions{" "}
                                  {question.type === "Matching Headings"
                                    ? getQuestionNumbersForHeadins(
                                        countListHeader(reading.content),
                                        reading.type
                                      )
                                    : getQuestionNumbers(question)}
                                </p>
                                <RichTextViewer
                                  headings={countListHeader(reading.content)}
                                  content={question.content}
                                  type={question.type}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabPane>
                    ))}
                  </Tabs>
                )}
              </Card>
              <Divider />
            </>

            {/* Writing section */}
            <Card
              title={
                <Flex justify="space-between" align="center" gap={20}>
                  <Title level={3}>Writing Section</Title>
                  <Flex align="center" gap={10}>
                    {writingTime && <Tag>Time Taken: {writingTime}</Tag>}
                    {status &&
                      (status === "WRITING_PROCESS" ? (
                        <Tag color="orange">Writing processing</Tag>
                      ) : status !== "WRITING_PROCESS" &&
                        writingStatus === "completed" ? (
                        <Tag color="green">Writing Completed</Tag>
                      ) : (
                        <Tag>Waiting Writing</Tag>
                      ))}
                    {/* {exam_id && (
                      <Button
                        type="primary"
                        onClick={() => retryListening("writing")}
                      >
                        Retry Listening
                      </Button>
                    )} */}
                    {writings.length === 0 && (
                      <Button
                        htmlType="button"
                        onClick={() => resetSection("writing")}
                      >
                        Reset Writing
                      </Button>
                    )}
                  </Flex>
                </Flex>
              }
              variant={"borderless"}
            >
              {writings.length > 0 && (
                <Tabs defaultActiveKey="0">
                  {writings.map((writing, index) => (
                    <TabPane
                      tab={
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <FileWordOutlined style={{ marginLeft: "5px" }} />
                          {`Task ${index + 1}`}
                        </span>
                      }
                      key={index}
                    >
                      <Flex align="start" gap="10px">
                        <p
                          style={{
                            fontSize: "18px",
                            fontWeight: 600,
                            height: "180px",
                            overflowY: "auto",
                            whiteSpace: "pre-wrap",
                            borderRadius: "4px",
                          }}
                        >
                          {writing.title}
                        </p>
                        {writing.image && (
                          <Image
                            width="400px"
                            src={writing.image}
                            alt="Writing task image"
                          />
                        )}
                      </Flex>
                    </TabPane>
                  ))}
                </Tabs>
              )}
            </Card>
          </>
        )}

        <ExtraTimeModal
          open={extraTimeOpen}
          onClose={() => setExtraTimeOpen(false)}
          target={examTarget}
          studentName={studentName}
          onGranted={() => setRefresh((prev) => prev + 1)}
        />

        <SectionReopenModal
          open={reopenOpen}
          onClose={() => setReopenOpen(false)}
          target={examTarget}
          studentName={studentName}
          // The page shows the module scores this just cleared, so it re-reads.
          onReopened={() => setRefresh((prev) => prev + 1)}
        />

        <AudioRetryModal
          open={audioRetryOpen}
          onClose={() => setAudioRetryOpen(false)}
          target={examTarget}
          studentName={studentName}
        />
      </Content>
    </Layout>
  );
};

export default ContestDetails;
