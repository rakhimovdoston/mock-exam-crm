import React, { useState } from "react";
import { Modal, Button, Input, Upload, Progress, Select } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { apiClient } from "../../services/api"; // Adjust the import path as necessary
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const ListeningModal = ({ visible, onClose }) => {
  const [title, setTitle] = useState();
  const [audioFile, setAudioFile] = useState();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [type, setType] = useState("all");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!title || !audioFile || type === "all") {
      toast.error(
        "Please provide both a title and listening part and and an audio file."
      );
      return;
    }
    const data = {
      title,
      audio: audioFile,
      type: type,
    };

    setLoading(true);
    try {
      const response = await apiClient.post("api/v1/listening/save", data);
      if (response.code !== 200) {
        toast.error(response.message || "Failed to save listening data.");
        return;
      }
      toast.success("Listening data saved successfully.");
      onClose(false);
      navigate(`/dashboard/ielts/listening/${response.data.id}`);
    } catch (error) {
      console.error("Error saving listening data:", error);
      toast.error("An error occurred while saving the listening data.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (info) => {
    const file = info.file;
    if (!file) {
      toast.error("Please select an audio file to upload.");
      return;
    }
    const formData = new FormData();
    formData.append("audio", file);

    try {
      const response = await apiClient.post("api/v1/file/audio", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      if (response.code !== 200) {
        toast.error(response.message || "Failed to upload audio file.");
      }

      setAudioFile(response.data.url);
    } catch (error) {
      console.error("Error uploading audio file:", error);
      toast.error("An error occurred while uploading the audio file.");
    } finally {
      setUploadProgress(0); // Reset progress after upload attempt
    }
  };

  return (
    <Modal
      title="Listening Modal"
      open={visible}
      onCancel={() => onClose(false)}
      footer={[
        <Button key="close" onClick={() => onClose(false)}>
          Close
        </Button>,
        <Button key={"next"} onClick={handleNext} type="primary">
          Next
        </Button>,
      ]}
    >
      <p>Select Listening part.</p>
      <Select
        defaultValue={type}
        onChange={(e) => setType(e)}
        style={{ width: 200 }}
      >
        <Option value="all">All</Option>
        <Option value="part_1">Listening Part 1</Option>
        <Option value="part_2">Listening Part 2</Option>
        <Option value="part_3">Listening Part 3</Option>
        <Option value="part_4">Listening Part 4</Option>
      </Select>
      <p>Content for the listening modal goes here.</p>
      <Input
        placeholder="Enter title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ marginBottom: "16px" }}
      />
      <Upload
        name="audio"
        accept="audio/*"
        showUploadList={false}
        beforeUpload={() => false} // Prevent automatic upload
        onChange={handleFileChange}
        style={{ display: audioFile ? "none" : "block" }}
      >
        <Button icon={<UploadOutlined />}>Upload Audio File</Button>
      </Upload>
      {uploadProgress > 0 && (
        <Progress percent={uploadProgress} style={{ marginTop: "16px" }} />
      )}
      {audioFile && (
        <audio
          controls
          controlsList="nodownload noplaybackrate"
          src={audioFile}
          style={{ marginTop: "16px", width: "100%" }}
        >
          Your browser does not support the audio element.
        </audio>
      )}
    </Modal>
  );
};

export default ListeningModal;
