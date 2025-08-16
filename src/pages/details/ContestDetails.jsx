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
} from "antd";
import {
  AudioOutlined,
  ReadOutlined,
  FileWordOutlined,
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
    listening = [],
    writings = [],
    speaking = {},
  } = data.data;

  const getColor = (status) => {
    switch (status) {
      case "PROCESS":
        return "orange";
      case "COMPLETED":
        return "green";
      case "IN_COMPLED":
        return "gray";
      case "FAILED":
        return "red";
      default:
        return "gray";
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
      examId: exam_id ? exam_id : booking.id,
      type: exam_id ? "exam" : "booking",
      userId: user.id,
    };
    console.log("Resetting section:", request);

    try {
      const response = await apiClient.post(
        `api/v1/exam/reset-section`,
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
      toast.error("Error resetting section:", error);
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
              <Card title="Booking Details" variant={"borderless"}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Flex gap={10} align="center">
                    <Text strong>Student Name:</Text>
                    <Text>{booking?.studentName || "N/A"}</Text>
                  </Flex>
                  <Flex gap={10} align="center">
                    <Text strong>Status:</Text>
                    <Tag color={getColor(booking.status)}>
                      {booking?.status || "N/A"}
                    </Tag>
                  </Flex>
                  <Flex gap={10} align="center">
                    <Text strong>Branch:</Text>
                    <Text>{booking?.branch || "N/A"}</Text>
                  </Flex>
                  <Flex gap={10} align="center">
                    <Text strong>Test Date:</Text>
                    <Tag color="blue">{booking?.testDate || "N/A"}</Tag>
                  </Flex>
                  <Flex gap={10} align="center">
                    <Text strong>Test Time:</Text>
                    <Tag color="blue">{booking?.time || "N/A"}</Tag>
                  </Flex>
                </Space>
              </Card>
            </Col>
          )}

          {/* User Info */}
          <Col xs={24} md={12}>
            <Card title="User Info" variant={"borderless"}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Flex gap={10} align="center">
                  <Text strong>Full Name:</Text>
                  <Text>
                    {user?.firstname ?? ""} {user?.lastname ?? ""}
                  </Text>
                </Flex>
                <Flex gap={10} align="center">
                  <Text strong>Email:</Text>
                  <Text>{user?.email || "N/A"}</Text>
                </Flex>
                <Flex gap={10} align="center">
                  <Text strong>Username:</Text>
                  <Text>{user?.username || "N/A"}</Text>
                </Flex>
                <Button type="primary" style={{ cursor: "pointer" }}>
                  <Link
                    to={`/dashboard/user/${user.id}`}
                    style={{ color: "white" }}
                  >
                    View user details
                  </Link>
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
        <Divider />

        {/* Listening section */}
        {data.data.type === "SPEAKING" && (
          <Card
            title={
              <Flex justify="space-between" align="center" gap={20}>
                <p>Speaking Details</p>
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
                    {(!listening || listening.size === 0) && (
                      <Button onClick={() => resetSection("listening")}>
                        Reset listening
                      </Button>
                    )}
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
                    {(!readings || readings.size === 0) && (
                      <Button onClick={() => resetSection("reading")}>
                        Reset reading
                      </Button>
                    )}
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
                  {(!writings || writings.size === 0) && (
                    <Button onClick={() => resetSection("writing")}>
                      Reset Writing
                    </Button>
                  )}
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
      </Content>
    </Layout>
  );
};

export default ContestDetails;
