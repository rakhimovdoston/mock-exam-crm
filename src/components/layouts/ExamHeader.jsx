import React, { useEffect, useState } from "react";
import {
  Layout,
  Button,
  Modal,
  Result,
  Dropdown,
  Flex,
  Select,
} from "antd";
import {
  ClockCircleOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  ProfileOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import apiClient from "../../services/api";
import { enterFullScreen, isFullScreen } from "../../utils/documentUtils";
import AnswerReviewModal from "../modal/AnswerReviewModal";
import { logo } from "../../assets";
import store from "../../store";
import { changeSize } from "../../store/appReducer";
import { clearExamAnswers } from "../../store/examReducer";

const { Header } = Layout;

const ExamHeader = ({ type, totalExamTimeInSeconds = 0 }) => {
  const { id } = useParams();
  const [timeLeft, setTimeLeft] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isReviewVisible, setIsReviewVisible] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (type === "reading") {
      setTimeLeft(60 * 60);
    } else if (totalExamTimeInSeconds) {
      setTimeLeft(totalExamTimeInSeconds);
    } else {
      setTimeLeft(30 * 60);
    }
  }, [type, totalExamTimeInSeconds]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setIsModalVisible(true);
          setTimeout(() => {
            handleModalOk();
          }, 2000);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (seconds == 0) return <span>--</span>;
    return (
      <span style={{ color: minutes <= 1 ? "red" : "black" }}>
        <span style={{ fontWeight: "bold" }}>
          {minutes > 0
            ? minutes.toString().padStart(2, "0")
            : secs.toString().padStart(2, "0")}
        </span>{" "}
        {minutes > 0 ? "minutes" : "seconds"} remaining
      </span>
    );
  };

  const handleModalOk = async () => {
    setLoading(true);
    const latestAnswer = store.getState().exam.answers;
    const request = {
      type: type,
      questionAnswers: latestAnswer,
    };

    try {
      const response = await apiClient.post(
        `/api/v1/exam/answers/${id}`,
        request
      );
      if (response.code !== 200) {
        toast.error(
          response.message || "Failed to submit answers. Please try again."
        );
        return;
      }
      toast.success("Answers submitted successfully!");
      dispatch(clearExamAnswers());
      navigate(`/exam/${id}`);
    } catch (error) {
      console.error("Error submitting answers:", error);
      toast.error("Failed to submit answers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      <Header
        style={{
          textAlign: "center",
          position: "sticky",
          top: 0,
          background: "white",
          boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* {type === "reading" ? "Reading Test" : "Listening Test"} */}
            <img src={logo} alt="Logo" width={100} />
          </div>
          <span
            style={{
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <ClockCircleOutlined
              style={{
                fontSize: "16px",
                color: timeLeft <= 60 ? "red" : "black",
              }}
            />
            {formatTime(timeLeft)}
          </span>
          <div style={{ display: "flex", gap: 15 }}>
            <Button
              onClick={enterFullScreen}
              icon={
                isFullScreen() ? (
                  <FullscreenExitOutlined />
                ) : (
                  <FullscreenOutlined />
                )
              }
            />
            <Dropdown
              menu={{
                items: [
                  // {
                  //   disabled: true,
                  //   label: (
                  //     <Flex justify="space-between" gap={20}>
                  //       <span>Nigh Mode</span>
                  //       <Switch
                  //         defaultChecked={
                  //           localStorage.getItem("theme") === 'dark'
                  //         }
                  //         onChange={(e) => {
                  //           localStorage.setItem("theme", e ? "dark" : "white");
                  //         }}
                  //       />
                  //     </Flex>
                  //   ),
                  //   key: "0",
                  // },
                  {
                    label: (
                      <Flex justify="space-between" align="center" gap={20}>
                        <span>Text Size</span>
                        <Select
                          style={{ width: 90 }}
                          defaultValue={
                            localStorage.getItem("size") || "middle"
                          }
                          onChange={(e) => dispatch(changeSize({ size: e }))}
                        >
                          <Select.Option value="12">Small</Select.Option>
                          <Select.Option value="16">Middle</Select.Option>
                          <Select.Option value="20">Large</Select.Option>
                        </Select>
                      </Flex>
                    ),
                    disabled: true,
                    key: "1",
                  },
                ],
              }}
              trigger={["click"]}
            >
              <Button icon={<SettingOutlined />} />
            </Dropdown>
            <Button
              icon={<ProfileOutlined />}
              onClick={() => setIsReviewVisible(true)}
            >
              Review
            </Button>
            <Button
              type="primary"
              style={{ fontWeight: "bold" }}
              onClick={() => setIsModalVisible(true)}
            >
              Submit
            </Button>
          </div>
        </div>
      </Header>
      <AnswerReviewModal
        open={isReviewVisible}
        onClose={() => setIsReviewVisible(false)}
      />
      <Modal
        open={isModalVisible}
        closable={timeLeft > 0}
        footer={
          timeLeft > 0 && [
            <Button
              key="submit"
              type="primary"
              onClick={handleModalOk}
              loading={loading}
            >
              Submit
            </Button>,
            <Button
              key="cancel"
              onClick={handleModalCancel}
              disabled={timeLeft <= 0}
            >
              Cancel
            </Button>,
          ]
        }
        centered
      >
        <Result
          title={
            timeLeft <= 0
              ? "Time is up. sending your answers"
              : "Are you sure you want to submit?"
          }
        />
      </Modal>
    </>
  );
};

export default ExamHeader;
