import { Button, Card, Input, Modal, Space, theme, Typography } from "antd";
import apiClient from "../services/api";
import { useState } from "react";
import { Link } from "react-router-dom";
import { EyeOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const ScoreBox = ({
  id,
  icon,
  label,
  score,
  setRefresh,
  userId,
  booking = false,
  isBeforeDate = false,
}) => {
  const { token } = theme.useToken();
  const [isSpeakingModalVisible, setIsSpeakingModalVisible] = useState(false);
  const [selectedSpeakingScore, setSelectedSpeakingScore] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSpeakingModalOk = async () => {
    if (errorMessage) {
      toast.error("Score must be between 0.0 and 9.0");
      return;
    }
    setLoading(true);
    const requestBody = {
      examId: id,
      type: "speaking",
      score: selectedSpeakingScore,
    };
    try {
      const response = await apiClient.post(
        `api/v1/history/set-score/${userId}`,
        requestBody
      );
      if (response.code !== 200) {
        toast.error(response.message || "Set Score some error");
        return;
      }
      setIsSpeakingModalVisible(false);
      setRefresh((prev) => prev + 1);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handleSpeakingModalCancel = () => {
    setErrorMessage("");
    setSelectedSpeakingScore(null);
    setIsSpeakingModalVisible(false);
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

  return (
    <>
      <Card
        size="small"
        style={{
          minWidth: 120,
          textAlign: "center",
          backgroundColor:
            !isBeforeDate && booking
              ? token.colorErrorBg
              : token.colorPrimaryBg,
          border: `1px solid ${
            !isBeforeDate && booking ? token.colorError : token.colorPrimary
          }`,
          borderRadius: "8px",
        }}
      >
        <Space direction="vertical">
          {icon}
          <Text strong>{label}</Text>
          <Text>{score ?? "0.0"} score</Text>
          {booking ? (
            <div></div>
          ) : label === "Speaking" ? (
            <Button
              onClick={() => {
                setIsSpeakingModalVisible(true);
                setSelectedSpeakingScore(score);
              }}
            >
              Set score
            </Button>
          ) : (
            <Link
              to={
                label === "Writing"
                  ? `/dashboard/history/${userId}/${label.toLowerCase()}/${id}`
                  : `/dashboard/history/${id}/${label.toLowerCase()}`
              }
            >
              <Button type="dashed" icon={<EyeOutlined />} />
            </Link>
          )}
        </Space>
      </Card>
      <Modal
        title="Speaking Assessment"
        open={isSpeakingModalVisible}
        onOk={handleSpeakingModalOk}
        okButtonProps={{
          disabled: loading,
          loading: loading,
        }}
        onCancel={handleSpeakingModalCancel}
      >
        <p>Current Speaking Score: {selectedSpeakingScore ?? "0.0"} ball</p>
        <Input
          min={0.0}
          max={9.0}
          value={selectedSpeakingScore}
          placeholder="Enter new speaking score (5.5)"
          type="number"
          onChange={handleInputChange}
        />
        {errorMessage && (
          <p style={{ color: "red", marginTop: "10px" }}>{errorMessage}</p>
        )}
      </Modal>
    </>
  );
};

export default ScoreBox;
